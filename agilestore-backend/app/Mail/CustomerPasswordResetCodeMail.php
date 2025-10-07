<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class CustomerPasswordResetCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $fullName,
        public string $code,           // OTP 6 digit (plain, untuk email)
        public int $minutes = 15       // masa berlaku
    ) {}

    public function build()
    {
        return $this->subject('Your Agile Store password reset code')
            ->markdown('emails.customer.password-reset-code', [
                'name'    => $this->fullName,
                'code'    => $this->code,
                'minutes' => $this->minutes,
            ]);
    }
}