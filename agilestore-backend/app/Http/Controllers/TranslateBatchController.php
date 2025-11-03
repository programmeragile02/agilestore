<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Stichoza\GoogleTranslate\GoogleTranslate;
use Illuminate\Support\Facades\Cache;

class TranslateBatchController extends Controller
{
    public function translate(Request $req): JsonResponse
    {
        $validated = $req->validate([
            'texts'    => 'required|array',
            'texts.*'  => 'nullable|string',
            'from'     => 'nullable|string',
            'to'       => 'nullable|string',
            // FE mungkin kirim glossary; kita abaikan di stichoza (tidak mengganggu)
            'glossary' => 'nullable|array',
        ]);

        $texts = array_map(fn($t) => (string)($t ?? ''), $validated['texts']);
        $from  = $validated['from'] ?? 'en';
        $to    = $validated['to']   ?? 'id';

        if (count($texts) === 0) {
            return response()->json(['ok' => true, 'data' => []]);
        }

        // Inisialisasi translator
        $tr = new GoogleTranslate();
        $tr->setSource($from);
        $tr->setTarget($to);

        // Batching sederhana (kalau mau batasi per request)
        $batchSize = (int) env('TRANSLATE_BATCH_SIZE', 80);

        $out = [];
        for ($i = 0; $i < count($texts); $i += $batchSize) {
            $slice = array_slice($texts, $i, $batchSize);
            foreach ($slice as $text) {
                try {
                    // OPTIONAL CACHE (aktifkan kalau mau)
                    // $key = "t:$from:$to:" . md5($text);
                    // $translated = Cache::remember($key, now()->addDays(30), fn() => $tr->translate($text) ?? $text);

                    $translated = $tr->translate($text) ?? $text;
                    $out[] = (string) $translated;
                } catch (\Throwable $e) {
                    // Fallback: pakai teks asli agar length tetap sama
                    $out[] = $text;
                }
            }
        }

        if (count($out) !== count($texts)) {
            return response()->json([
                'ok' => false,
                'error' => "Translate length mismatch (got ".count($out)." expected ".count($texts).")",
            ], 500);
        }

        return response()->json(['ok' => true, 'data' => $out]);
    }
}
