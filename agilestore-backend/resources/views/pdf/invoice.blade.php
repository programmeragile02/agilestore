<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice {{ $invoice_no }}</title>
  <style>
    /* ========= Tokens ========= */
    :root{
      --ink:#0f172a; --muted:#475569; --line:#e2e8f0; --bg:#ffffff; --bg-soft:#f8fafc;
      --pri:#1e40af; --pri-600:#4f46e5; --pri-200:#c7d2fe; --pri-100:#e0e7ff;
      --succ:#059669; --succ-100:#d1fae5; --gray-100:#f1f5f9;
    }

    /* ========= Base ========= */
    *{box-sizing:border-box;}
    html,body{margin:0;padding:0;}
    @page{ margin: 18px; }            /* rapat agar muat 1 halaman */
    body{
      font-family: DejaVu Sans, Arial, Helvetica, sans-serif;
      color:var(--ink);
      background:var(--bg);
      font-size:12.5px;               /* sedikit lebih besar */
      line-height:1.5;
    }
    .container{ padding: 18px; }

    /* ========= Brand Bar (simetris) ========= */
    .brandbar{
      background: var(--pri);
      color:#fff;
      padding:14px;                   /* atas/bawah = kiri/kanan */
    }
    .brandrow{ display:flex; justify-content:space-between; gap:12px; }
    .brandbar .left h1{ margin:0 0 4px 0; font-size:20px; font-weight:800; }
    .brandbar .small{ opacity:.95; font-size:12.5px; }
    .meta{ text-align:right; }
    .meta h2{ margin:0 0 2px 0; font-size:16px; font-weight:800; color:#fff; }
    .meta .label{ color:#eef2ff; font-size:12px; }
    .badge-paid{
      display:inline-block; padding:5px 10px; font-weight:700; font-size:11.5px;
      color:#065f46; background:var(--succ-100); border:1px solid var(--succ); border-radius:999px;
      margin-top:6px;
    }

    /* ========= Sections / Cards ========= */
    .section-title{
      margin:14px 0 8px;
      font-weight:800; color:var(--pri); font-size:14px;
      border-left:4px solid var(--pri-600); padding-left:8px;
    }
    .grid{ display:flex; gap:12px; }
    .col{ flex:1; }
    .card{
      border:1px solid var(--line);
      border-radius:10px;
      background:var(--bg-soft);
      padding:10px 12px;
      margin-bottom:10px;             /* jarak antar card */
      page-break-inside: avoid;
    }
    .muted{ color:var(--muted); }
    .kv{ margin:3px 0; }
    .kv strong{ display:inline-block; min-width:90px; }

    /* ========= Table ========= */
    table{ width:100%; border-collapse:collapse; }
    thead th{
      /* penting: gunakan background TERANG agar tetap terlihat bila engine abaikan warna */
      background: var(--pri-100);
      color:#1e293b;                  /* teks gelap */
      font-weight:700; font-size:12.5px;
      padding:8px 10px;
      text-align:left;
      border:1px solid var(--pri-200);
    }
    tbody td{
      background:#fff;
      border:1px solid var(--line);
      padding:8px 10px;
      vertical-align:top;
      font-size:12.5px;
    }
    tbody tr:nth-child(odd) td{ background:var(--gray-100); }
    .right{text-align:right;} .center{text-align:center;}

    /* ========= Totals ========= */
    .totals-wrap{ margin-top:10px; display:flex; justify-content:flex-end; }
    .totals{
      width:48%; min-width:290px;
      border:1px solid var(--line); border-radius:10px; overflow:hidden; page-break-inside:avoid;
    }
    .totals .row{ display:flex; justify-content:space-between; padding:10px 12px; background:#fff; border-bottom:1px solid var(--line); }
    .totals .row.alt{ background:var(--pri-100); }
    .totals .row.total{ background:var(--pri); color:#fff; font-weight:800; font-size:14px; }

    /* ========= Footer ========= */
    .footer{
      margin-top:14px; padding-top:10px;
      border-top:1px dashed var(--line);
      color:var(--muted); font-size:12px;
    }

    /* ========= Watermark ========= */
    .watermark{
      position:fixed; top:44%; left:10%; right:10%;
      text-align:center; font-size:70px; color:rgba(16,185,129,0.08);
      transform:rotate(-18deg); font-weight:900;
    }
  </style>
</head>
<body>

<div class="watermark">PAID</div>

<!-- Header -->
<div class="brandbar">
  <div class="brandrow">
    <div class="left">
      <h1>{{ $company->name }}</h1>
      <div class="small">{{ $company->address }}</div>
      <div class="small">{{ $company->email }} · {{ $company->phone }}</div>
    </div>
    <div class="meta">
      <h2>Invoice</h2>
      <div class="label">No:</div>
      <div style="font-weight:700">{{ $invoice_no }}</div>
      <div class="label" style="margin-top:4px;">Date:</div>
      <div style="font-weight:700">{{ $issued_at->format('d M Y') }}</div>
      <span class="badge-paid">PAID</span>
    </div>
  </div>
</div>

<div class="container">
  <!-- Details -->
  <div class="section-title">Invoice Details</div>
  <div class="grid">
    <div class="col card">
      <div style="font-weight:800; margin-bottom:6px;">Billed To</div>
      <div style="font-weight:700">{{ $customer->name }}</div>
      <div class="muted">{{ $customer->email }}</div>
      @if(!empty($customer->phone))
      <div class="muted">{{ $customer->phone }}</div>
      @endif
    </div>
    <div class="col card">
      <div style="font-weight:800; margin-bottom:6px;">Order Info</div>
      <div class="kv"><strong>Order ID</strong> {{ $order->midtrans_order_id }}</div>
      <div class="kv"><strong>Product</strong> {{ $order->product_name ?? $order->product_code }}</div>
      <div class="kv"><strong>Package</strong> {{ $order->package_name ?? $order->package_code }}</div>
      <div class="kv"><strong>Duration</strong> {{ $order->duration_name ?? $order->duration_code }}</div>
      <div class="kv"><strong>Intent</strong> {{ ucfirst($order->intent) }}</div>
      @if($order->paid_at)
      <div class="kv"><strong>Paid At</strong> {{ \Carbon\Carbon::parse($order->paid_at)->format('d M Y H:i') }}</div>
      @endif
    </div>
  </div>

  <!-- Items -->
  <div class="section-title">Billing Items</div>
  <table>
    <thead>
      <tr>
        <th style="width:56%">Description</th>
        <th class="center" style="width:10%">Qty</th>
        <th class="right" style="width:17%">Unit Price</th>
        <th class="right" style="width:17%">Amount</th>
      </tr>
    </thead>
    <tbody>
    @foreach($items as $it)
      <tr>
        <td>{{ $it->description }}</td>
        <td class="center">{{ number_format($it->qty) }}</td>
        <td class="right">{{ $currency }} {{ number_format($it->unit_price, 0, ',', '.') }}</td>
        <td class="right">{{ $currency }} {{ number_format($it->subtotal, 0, ',', '.') }}</td>
      </tr>
    @endforeach
    </tbody>
  </table>

  <!-- Totals -->
  @php
    $subtotal = collect($items)->sum('subtotal');
    $discount = $discount ?? 0;
    $tax = 0;
    if(!empty($tax_percent)) $tax = round(($subtotal - $discount) * ($tax_percent/100));
    $grand = $total ?? ($subtotal - $discount + $tax);
  @endphp

  <div class="totals-wrap">
    <div class="totals">
      <div class="row">
        <div>Subtotal</div>
        <div class="right">{{ $currency }} {{ number_format($subtotal, 0, ',', '.') }}</div>
      </div>
      <div class="row alt">
        <div>Discount</div>
        <div class="right">- {{ $currency }} {{ number_format($discount, 0, ',', '.') }}</div>
      </div>
      @if(!empty($tax_percent))
      <div class="row">
        <div>Tax ({{ $tax_percent }}%)</div>
        <div class="right">{{ $currency }} {{ number_format($tax, 0, ',', '.') }}</div>
      </div>
      @endif
      <div class="row total">
        <div>Total</div>
        <div class="right">{{ $currency }} {{ number_format($grand, 0, ',', '.') }}</div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    Terima kasih atas pembayaran Anda. Invoice ini merupakan bukti pembayaran sah yang diterbitkan oleh {{ $company->name }}.
    Untuk bantuan, hubungi {{ $company->email }}.
  </div>
</div>
</body>
</html>