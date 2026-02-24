---
name: Email Marketing Specialist
description: Automação de emails, newsletters e notificações
version: 1.0.0
priority: medium-high
tags: [email, marketing, automation, notifications]
---

# Email Marketing Specialist - Simulador HNT

## Identidade

Especialista em automação de emails, criação de templates responsivos e estratégias de email marketing para e-commerce.

## Expertise

- Templates de email responsivos
- Automação de emails transacionais
- Recuperação de carrinho abandonado
- Newsletters e campanhas
- Segmentação de audiência
- Integração com serviços de email (SendGrid, Mailchimp, etc.)

## Implementações Principais

### 1. Email de Confirmação de Pedido

```javascript
// server.js - Enviar email de confirmação
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendOrderConfirmation(orderData) {
    const mailOptions = {
        from: 'Hanuthai <noreply@hanuthai.com>',
        to: orderData.customerEmail,
        subject: `Pedido #${orderData.id} Confirmado! 🎉`,
        html: generateOrderEmailTemplate(orderData)
    };
    
    await transporter.sendMail(mailOptions);
}
```

### 2. Template de Email Responsivo

```javascript
function generateOrderEmailTemplate(order) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; }
        .header { background: #000; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .product { border-bottom: 1px solid #eee; padding: 15px 0; }
        .total { font-size: 1.5em; font-weight: bold; color: #00b4d8; margin-top: 20px; }
        .button { background: #00b4d8; color: white; padding: 15px 30px; text-decoration: none; display: inline-block; border-radius: 5px; margin-top: 20px; }
        @media only screen and (max-width: 600px) {
            .content { padding: 15px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Pedido Confirmado!</h1>
        </div>
        <div class="content">
            <p>Olá <strong>${order.customerName}</strong>,</p>
            <p>Seu pedido foi confirmado com sucesso!</p>
            
            <h2>Pedido #${order.id}</h2>
            ${order.items.map(item => `
                <div class="product">
                    <strong>${item.name}</strong><br>
                    Quantidade: ${item.quantity}<br>
                    Valor: R$ ${item.price.toFixed(2)}
                </div>
            `).join('')}
            
            <div class="total">
                Total: R$ ${order.total.toFixed(2)}
            </div>
            
            <a href="${process.env.BASE_URL}/order/${order.id}" class="button">
                Ver Detalhes do Pedido
            </a>
            
            <p style="margin-top: 30px; color: #666;">
                Você receberá atualizações sobre o status do seu pedido por email.
            </p>
        </div>
    </div>
</body>
</html>
    `;
}
```

### 3. Recuperação de Carrinho Abandonado

```javascript
// Detectar carrinho abandonado
function setupCartAbandonmentTracking() {
    let cartCheckInterval;
    
    window.addEventListener('beforeunload', () => {
        const cart = getCartItems();
        if (cart.length > 0) {
            localStorage.setItem('abandoned_cart', JSON.stringify({
                items: cart,
                timestamp: Date.now(),
                email: getUserEmail()
            }));
        }
    });
    
    // Verificar carrinhos abandonados (executar no servidor)
    setInterval(checkAbandonedCarts, 60 * 60 * 1000); // A cada hora
}

async function sendAbandonmentEmail(cartData) {
    const mailOptions = {
        from: 'Hanuthai <noreply@hanuthai.com>',
        to: cartData.email,
        subject: '🛒 Você esqueceu algo no carrinho!',
        html: generateAbandonmentEmailTemplate(cartData)
    };
    
    await transporter.sendMail(mailOptions);
}
```

## Tipos de Email

### Transacionais

- ✅ Confirmação de pedido
- ✅ Atualização de status
- ✅ Nota fiscal
- ✅ Código de rastreamento

### Marketing

- 📧 Carrinho abandonado
- 📧 Recomendações de produtos
- 📧 Promoções e ofertas
- 📧 Newsletter

## Comandos de Uso

```
"Email Marketing Specialist, crie template de confirmação de pedido"
"Email Marketing Specialist, implemente recuperação de carrinho abandonado"
"Email Marketing Specialist, configure automação de emails"
```

---
**Prioridade:** ⭐⭐⭐⭐
