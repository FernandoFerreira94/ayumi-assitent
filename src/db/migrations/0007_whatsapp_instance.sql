-- Uma instância da Evolution (WhatsApp) por estúdio, criada pelo app.
ALTER TABLE tenants ADD COLUMN whatsapp_instance text UNIQUE;
