<?php

namespace App\Http\Controllers;

use App\Models\AgileStoreSection;
use App\Models\AgileStoreItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AgileStoreController extends Controller
{
    /**
     * List sections (with optional filter)
     * ?enabled=1|0, ?withItems=1|0
     */
    public function index(Request $req)
    {
        $withItems = (bool) $req->boolean('withItems', false);
        $enabled   = $req->query('enabled', null);

        $q = AgileStoreSection::query()->orderBy('order');

        if (!is_null($enabled)) {
            $q->where('enabled', (bool) $enabled);
        }

        if ($withItems) {
            $q->with(['items' => function ($q) {
                $q->orderBy('order');
            }]);
        }

        return response()->json([
            'success' => true,
            'data'    => $q->get(),
        ]);
    }

    /**
     * Get section by key with items
     */
    public function showByKey(string $key)
    {
        $section = AgileStoreSection::with(['items' => function ($q) {
            $q->orderBy('order');
        }])->where('key', $key)->first();

        if (!$section) {
            return response()->json([
                'success' => true,
                'data'    => [
                    'key'     => $key,
                    'name'    => null,
                    'enabled' => false,
                    'order'   => 0,
                    'theme'   => null,
                    'content' => null,
                    'items'   => [],
                ],
                'message' => 'Section belum ada, silakan simpan lewat /sections/save',
            ]);
        }

        return response()->json([
            'success' => true,
            'data'    => $section,
        ]);
    }

    /**
     * Create/Update Section by key + nested items
     * Body:
     * {
     *   "key": "landing_testimonials",
     *   "name": "Landing Testimonials",
     *   "enabled": true,
     *   "order": 2,
     *   "theme": {...},      // optional JSON
     *   "content": {...},    // optional JSON
     *   "items": [           // optional
     *     {
     *       "id": null|number,
     *       "item_type": "testimonial|hero|pricing|feature|faq|custom",
     *       "title": "...",
     *       "subtitle": "...",
     *       "description": "...",
     *       "cta_label": "...",
     *       "order": 1,
     *       "product_code": "TIRTABENING",
     *       "package_id": null,
     *       "duration_id": null,
     *       "price_monthly": 0,
     *       "price_yearly": 0,
     *       "extras": {...}  // bebas
     *     }
     *   ],
     *   "sync_items": true   // optional: jika true, items yang tidak ada di payload akan dihapus
     * }
     */
    public function saveSection(Request $req)
    {
        $sectionData = $req->validate([
            'key'     => ['required', 'string', 'max:150'],
            'name'    => ['nullable', 'string', 'max:200'],
            'enabled' => ['nullable', 'boolean'],
            'order'   => ['nullable', 'integer', 'min:0'],
            'theme'   => ['nullable', 'array'],
            'content' => ['nullable', 'array'],

            'items'                       => ['nullable', 'array'],
            'items.*.id'                  => ['nullable', 'integer', 'exists:agile_store_items,id'],
            'items.*.item_type'           => ['required_with:items', Rule::in(['hero','testimonial','pricing','feature','faq','custom'])],
            'items.*.title'               => ['nullable', 'string', 'max:255'],
            'items.*.subtitle'            => ['nullable', 'string', 'max:255'],
            'items.*.description'         => ['nullable', 'string'],
            'items.*.cta_label'           => ['nullable', 'string', 'max:120'],
            'items.*.order'               => ['nullable', 'integer', 'min:0'],
            'items.*.product_code'        => ['nullable', 'string', 'max:100'],
            'items.*.package_id'          => ['nullable', 'integer'],
            'items.*.duration_id'         => ['nullable', 'integer'],
            'items.*.price_monthly'       => ['nullable', 'numeric'],
            'items.*.price_yearly'        => ['nullable', 'numeric'],
            'items.*.extras'              => ['nullable', 'array'],

            'sync_items'                  => ['nullable', 'boolean'],
        ]);

        $syncItems = (bool) ($sectionData['sync_items'] ?? false);
        unset($sectionData['sync_items']);

        $itemsPayload = $sectionData['items'] ?? null;
        unset($sectionData['items']);

        return DB::transaction(function () use ($sectionData, $itemsPayload, $syncItems) {
            // upsert section by key
            $section = AgileStoreSection::with('items')->firstOrCreate(
                ['key' => $sectionData['key']],
                [
                    'name'    => $sectionData['name']    ?? ucwords(str_replace('_', ' ', $sectionData['key'])),
                    'enabled' => $sectionData['enabled'] ?? true,
                    'order'   => $sectionData['order']   ?? 0,
                    'theme'   => $sectionData['theme']   ?? null,
                    'content' => $sectionData['content'] ?? null,
                ]
            );

            // update fields if exist
            $section->fill([
                'name'    => $sectionData['name']    ?? $section->name,
                'enabled' => array_key_exists('enabled', $sectionData) ? (bool) $sectionData['enabled'] : $section->enabled,
                'order'   => $sectionData['order']   ?? $section->order,
                'theme'   => $sectionData['theme']   ?? $section->theme,
                'content' => $sectionData['content'] ?? $section->content,
            ])->save();

            $keptIds = [];

            // handle items if provided
            if (is_array($itemsPayload)) {
                foreach ($itemsPayload as $i => $item) {
                    $data = [
                        'section_id'    => $section->id,
                        'item_type'     => $item['item_type'] ?? 'custom',
                        'title'         => $item['title'] ?? null,
                        'subtitle'      => $item['subtitle'] ?? null,
                        'description'   => $item['description'] ?? null,
                        'cta_label'     => $item['cta_label'] ?? null,
                        'order'         => $item['order'] ?? $i, // default urutan sesuai index
                        'product_code'  => $item['product_code'] ?? null,
                        'package_id'    => $item['package_id'] ?? null,
                        'duration_id'   => $item['duration_id'] ?? null,
                        'price_monthly' => $item['price_monthly'] ?? null,
                        'price_yearly'  => $item['price_yearly'] ?? null,
                        'extras'        => $item['extras'] ?? null,
                    ];

                    if (!empty($item['id'])) {
                        // update
                        $model = AgileStoreItem::where('id', $item['id'])
                            ->where('section_id', $section->id)
                            ->first();

                        if ($model) {
                            $model->fill($data)->save();
                            $keptIds[] = $model->id;
                        }
                    } else {
                        // create
                        $model = AgileStoreItem::create($data);
                        $keptIds[] = $model->id;
                    }
                }

                // sync: delete items not in keptIds
                if ($syncItems) {
                    AgileStoreItem::where('section_id', $section->id)
                        ->whereNotIn('id', $keptIds)
                        ->delete();
                }
            }

            $section->load(['items' => fn($q) => $q->orderBy('order')]);

            return response()->json([
                'success' => true,
                'message' => 'Section tersimpan.',
                'data'    => $section,
            ]);
        });
    }

    /**
     * Toggle enabled
     */
    public function toggleEnabled(int $id)
    {
        $section = AgileStoreSection::findOrFail($id);
        $section->enabled = !$section->enabled;
        $section->save();

        return response()->json([
            'success' => true,
            'message' => 'Status enabled diperbarui.',
            'data'    => $section,
        ]);
    }

    /**
     * Duplicate section + items
     */
    public function duplicateSection(int $id)
    {
        $section = AgileStoreSection::with('items')->findOrFail($id);

        return DB::transaction(function () use ($section) {
            $copy = $section->replicate();
            $copy->key   = $section->key.'_copy_'.time();
            $copy->name  = ($section->name ?? $section->key).' (Copy)';
            $copy->order = ($section->order ?? 0) + 1;
            $copy->push();

            foreach ($section->items as $item) {
                $new = $item->replicate();
                $new->section_id = $copy->id;
                $new->save();
            }

            $copy->load(['items' => fn($q) => $q->orderBy('order')]);

            return response()->json([
                'success' => true,
                'message' => 'Section berhasil diduplikasi.',
                'data'    => $copy,
            ]);
        });
    }

    /**
     * Hapus section (soft delete dari model Section)
     */
    public function destroySection(int $id)
    {
        $section = AgileStoreSection::with('items')->findOrFail($id);

        return DB::transaction(function () use ($section) {
            // hapus items dulu (hard delete default)
            AgileStoreItem::where('section_id', $section->id)->delete();
            // soft delete section (pakai SoftDeletes)
            $section->delete();

            return response()->json([
                'success' => true,
                'message' => 'Section dihapus.',
            ]);
        });
    }

    /**
     * Reorder items in section
     * Body: { "items": [ { "id": 10, "order": 0 }, ... ] }
     */
    public function reorderItems(Request $req, int $sectionId)
    {
        $data = $req->validate([
            'items'         => ['required', 'array', 'min:1'],
            'items.*.id'    => ['required', 'integer', 'exists:agile_store_items,id'],
            'items.*.order' => ['required', 'integer', 'min:0'],
        ]);

        DB::transaction(function () use ($sectionId, $data) {
            foreach ($data['items'] as $row) {
                AgileStoreItem::where('id', $row['id'])
                    ->where('section_id', $sectionId)
                    ->update(['order' => $row['order']]);
            }
        });

        $section = AgileStoreSection::with(['items' => fn($q) => $q->orderBy('order')])
            ->findOrFail($sectionId);

        return response()->json([
            'success' => true,
            'message' => 'Urutan item diperbarui.',
            'data'    => $section,
        ]);
    }

    /**
     * Create/Update single item (tanpa menyentuh section meta)
     */
    public function saveItem(Request $req)
    {
        $data = $req->validate([
            'id'            => ['nullable', 'integer', 'exists:agile_store_items,id'],
            'section_id'    => ['required', 'integer', 'exists:agile_store_sections,id'],
            'item_type'     => ['required', Rule::in(['hero','testimonial','pricing','feature','faq','custom'])],
            'title'         => ['nullable', 'string', 'max:255'],
            'subtitle'      => ['nullable', 'string', 'max:255'],
            'description'   => ['nullable', 'string'],
            'cta_label'     => ['nullable', 'string', 'max:120'],
            'order'         => ['nullable', 'integer', 'min:0'],
            'product_code'  => ['nullable', 'string', 'max:100'],
            'package_id'    => ['nullable', 'integer'],
            'duration_id'   => ['nullable', 'integer'],
            'price_monthly' => ['nullable', 'numeric'],
            'price_yearly'  => ['nullable', 'numeric'],
            'extras'        => ['nullable', 'array'],
        ]);

        $item = null;

        if (!empty($data['id'])) {
            $item = AgileStoreItem::findOrFail($data['id']);
            $item->fill($data)->save();
        } else {
            $item = AgileStoreItem::create($data);
        }

        return response()->json([
            'success' => true,
            'message' => 'Item tersimpan.',
            'data'    => $item,
        ]);
    }

    /**
     * Hapus item
     */
    public function destroyItem(int $id)
    {
        $item = AgileStoreItem::findOrFail($id);
        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Item dihapus.',
        ]);
    }

    /**
     * Export section + items to JSON
     */
    public function exportSection(int $id)
    {
        $section = AgileStoreSection::with(['items' => fn($q) => $q->orderBy('order')])
            ->findOrFail($id);

        $payload = [
            'section' => [
                'key'     => $section->key,
                'name'    => $section->name,
                'enabled' => $section->enabled,
                'order'   => $section->order,
                'theme'   => $section->theme,
                'content' => $section->content,
            ],
            'items' => $section->items->map(function ($i) {
                return [
                    'item_type'     => $i->item_type,
                    'title'         => $i->title,
                    'subtitle'      => $i->subtitle,
                    'description'   => $i->description,
                    'cta_label'     => $i->cta_label,
                    'order'         => $i->order,
                    'product_code'  => $i->product_code,
                    'package_id'    => $i->package_id,
                    'duration_id'   => $i->duration_id,
                    'price_monthly' => $i->price_monthly,
                    'price_yearly'  => $i->price_yearly,
                    'extras'        => $i->extras,
                ];
            })->toArray(),
        ];

        return response()->json([
            'success' => true,
            'data'    => $payload,
        ]);
    }

    /**
     * Import section JSON (create or update by key)
     * Body:
     * {
     *   "section": {...},   // same as export
     *   "items":   [...]
     * }
     */
    public function importSection(Request $req)
    {
        $data = $req->validate([
            'section'            => ['required', 'array'],
            'section.key'        => ['required', 'string', 'max:150'],
            'section.name'       => ['nullable', 'string', 'max:200'],
            'section.enabled'    => ['nullable', 'boolean'],
            'section.order'      => ['nullable', 'integer', 'min:0'],
            'section.theme'      => ['nullable', 'array'],
            'section.content'    => ['nullable', 'array'],
            'items'              => ['nullable', 'array'],
            'items.*.item_type'  => ['required_with:items', Rule::in(['hero','testimonial','pricing','feature','faq','custom'])],
            'items.*.title'      => ['nullable', 'string', 'max:255'],
            'items.*.subtitle'   => ['nullable', 'string', 'max:255'],
            'items.*.description'=> ['nullable', 'string'],
            'items.*.cta_label'  => ['nullable', 'string', 'max:120'],
            'items.*.order'      => ['nullable', 'integer', 'min:0'],
            'items.*.product_code'=> ['nullable', 'string', 'max:100'],
            'items.*.package_id' => ['nullable', 'integer'],
            'items.*.duration_id'=> ['nullable', 'integer'],
            'items.*.price_monthly' => ['nullable', 'numeric'],
            'items.*.price_yearly'  => ['nullable', 'numeric'],
            'items.*.extras'     => ['nullable', 'array'],
        ]);

        return DB::transaction(function () use ($data) {
            $sec = $data['section'];

            $section = AgileStoreSection::updateOrCreate(
                ['key' => $sec['key']],
                [
                    'name'    => $sec['name']    ?? ucwords(str_replace('_', ' ', $sec['key'])),
                    'enabled' => $sec['enabled'] ?? true,
                    'order'   => $sec['order']   ?? 0,
                    'theme'   => $sec['theme']   ?? null,
                    'content' => $sec['content'] ?? null,
                ]
            );

            // bersihkan items lama
            AgileStoreItem::where('section_id', $section->id)->delete();

            foreach (($data['items'] ?? []) as $i => $item) {
                AgileStoreItem::create([
                    'section_id'    => $section->id,
                    'item_type'     => $item['item_type'] ?? 'custom',
                    'title'         => $item['title'] ?? null,
                    'subtitle'      => $item['subtitle'] ?? null,
                    'description'   => $item['description'] ?? null,
                    'cta_label'     => $item['cta_label'] ?? null,
                    'order'         => $item['order'] ?? $i,
                    'product_code'  => $item['product_code'] ?? null,
                    'package_id'    => $item['package_id'] ?? null,
                    'duration_id'   => $item['duration_id'] ?? null,
                    'price_monthly' => $item['price_monthly'] ?? null,
                    'price_yearly'  => $item['price_yearly'] ?? null,
                    'extras'        => $item['extras'] ?? null,
                ]);
            }

            $section->load(['items' => fn($q) => $q->orderBy('order')]);

            return response()->json([
                'success' => true,
                'message' => 'Import berhasil.',
                'data'    => $section,
            ]);
        });
    }
}
