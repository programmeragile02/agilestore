@component('mail::message')
# Reset your password

Hi {{ $name }},

Use this verification code to reset your Agile Store password:

@component('mail::panel')
<strong style="font-size:24px;letter-spacing:4px">{{ $code }}</strong>
@endcomponent

This code will expire in {{ $minutes }} minutes.  
If you didn’t request this, you can safely ignore this email.

Thanks,  
Agile Store Team
@endcomponent