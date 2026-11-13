---
id: login-cadastro
title: Login, cadastro e verificação
summary: Uma coluna curta com o mínimo de campos, erro no campo, senha com força só no cadastro e código de 6 dígitos.
intent: [login, entrar, cadastro, criar conta, recuperar senha, verificação, código sms, 2fa, otp]
group: conta
platform: ambos
products: [saas, ecommerce, fintech, mobile-app, admin]
components: [card, field, input, button, separator, password-strength, input-otp, countdown, form-validation, alert, checkbox]
patterns: [login-split-screen, otp-code-input, password-recovery-flow, two-factor-challenge]
status: stable
---
## Quando usar
Entrada no produto. Login: e-mail + senha (ou link mágico). Cadastro: no máximo 4 campos; o resto pede depois.

## Estrutura
```
coluna 400px centralizada (ou split com imagem no desktop)
card flat: logo + título "Entrar" + subtítulo curto
├─ provedores (Google/Apple) em button outline + separator "ou"
├─ field e-mail · field senha (mostrar/ocultar) + link "Esqueci" no rótulo
├─ cadastro: password-strength sob a senha + checkbox de termos
└─ button primário largura total + link "Criar conta" abaixo
verificação: input-otp 6 slots + countdown "Reenviar em 0:30"
```

## Comandos perto do contexto
- "Esqueci a senha" ao lado do rótulo da senha.
- Reenviar código junto do `input-otp`, liberado pelo `countdown`.
- Trocar login/cadastro no rodapé do card, não no topo.

## Material e movimento
Fundo liso ou imagem na metade; card `flat`. Nada animado além do botão em loading. OTP avança o foco sozinho e envia no 6º dígito.

## Estados
Erro de credencial: `alert` no topo do card (sem dizer qual campo errou). Erro de formato: no campo, no blur (`form-validation`). Conta bloqueada: `alert` com o que fazer.

## Evitar
Confirmar senha e e-mail duas vezes; força de senha no login; captcha antes do primeiro erro; placeholder no lugar do rótulo; limpar a senha ao errar o e-mail.

## Variações
- Sem senha: código por e-mail/WhatsApp direto (`input-otp`).
- Login social + e-mail, com o último método usado em destaque.
- Mobile iOS: tela cheia com teclado certo por campo e "Entrar com Apple".

## Esqueleto
```tsx
<Card variant="flat" className="mx-auto w-full max-w-sm"><CardHeader><CardTitle>Entrar</CardTitle></CardHeader>
  <CardContent className="space-y-4">
    <Button variant="outline" className="w-full">Continuar com Google</Button><Separator/>
    <Field><FieldLabel>E-mail</FieldLabel><Input type="email" autoComplete="email"/><FieldError/></Field>
    <Field><FieldLabel>Senha</FieldLabel><Input type="password"/><PasswordStrength/></Field>
    <Button className="w-full">Entrar</Button>
  </CardContent></Card>
// Verificação: <InputOTP maxLength={6}><InputOTPGroup><InputOTPSlot index={0}/>…</InputOTPGroup></InputOTP> <Countdown/>
```
