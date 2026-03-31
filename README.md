# FavorChain

**FavorChain** es una plataforma impulsada por Inteligencia Artificial y Bots de Telegram para emparejar necesidades de tu comunidad y gestionar tus apuntes/recordatorios personales ("Second Brain"). A través de esto, obtendrás puntos **Karma** por ayudar a otros.

---

## 🤖 Cómo empezar a usar el Bot en Telegram

Para probar la plataforma, sigue estos simples pasos desde tu celular o computadora:

### 1. Iniciar la conversación
1. Abre Telegram y busca el `@nombre_de_tu_bot` (el que creaste con BotFather).
2. Presiona el botón de **Iniciar** o escribe el comando:
   ```text
   /start
   ```
   El bot te dará la bienvenida y estará listo para escucharte.

### 2. Guardar conocimiento (Second Brain)
Si quieres guardar un recordatorio, una nota importante, o algo que aprendiste, solo envíaselo como mensaje normal: 
> **Tú:** "Acuérdate de que el framework ElysiaJS es muy rápido y se usa con Bun."
> **Bot:** "Guardado en tu Second Brain: ElysiaJS + Bun..."

### 3. Registrar un favor comunitario (Karma)
El bot detectará automáticamente usando Inteligencia Artificial si el mensaje que acabas de enviar es una ayuda que le prestaste a otra persona. ¡Si es un favor, ganarás Karma!
> **Tú:** "Hoy ayudé a mi vecino Pedro a cargar las bolsas del mercado hasta su departamento."
> **Bot:** "Favor registrado: Ayuda cargando bolsas. ¡Has ganado 10 puntos de Karma!"

---

## 💻 Cómo ver el historial de tu Karma (Frontend)

El proyecto incluye un panel retro-futurista para consultar todos tus puntos acumulados.

1. **Averigua tu ID de Telegram:** Tu "Usuario" real en el bot es numérico. Puedes obtenerlo hablando con bots como `@userinfobot`. 
2. **Entra al Dashboard:**
   Abre [http://localhost:5173](http://localhost:5173) en tu navegador.
3. **Escanea/Busca tu usuario:**
   Coloca tu ID numérico en la barra de búsqueda y verás instantáneamente los favores que realizaste y tu número de Karma total brillar en la pantalla.

---

## 👥 Uso en Grupos Comunitarios (Hackathon)

El verdadero potencial de **FavorChain** se libera en grupos vecinales, universitarios o comunidades enteras en Telegram:

1. **Invita al Bot a tu Grupo:** Ve al perfil del bot y haz tap en "Añadir a un Grupo". Selecciona la comunidad donde quieras que actúe.
2. **Configuración Inicial:** Por defecto, los bots no leen todos los mensajes de los grupos por privacidad. Si quieres que el bot escuche y empareje a la comunidad automáticamente debes ir a **BotFather**, seleccionar el bot, buscar los `Bot Settings` -> `Group Privacy` y marcarlo como **Turn Off "Enable Privacy Mode"**.
3. **Karma Pasivo:** A partir de entonces, cuando dos personas conversen (ej. "Yo te presto mis apuntes Juan") el bot intervendrá orgánicamente para premiar sus buenas acciones sin necesidad de invocarlo.

---

## 🚀 Despliegue con Docker (Dockploy)

Para levantar ambos entornos (Backend y Frontend) de forma aislada y profesional, puedes usar **Docker Compose**:

1. **Configura tus variables de entorno:**  
   Asegúrate de que el archivo `.env` en la raíz tenga las claves de Supabase, OpenRouter y Telegram.

2. **Construye y levanta los contenedores:**
   ```bash
   docker-compose up --build -d
   ```

3. **Accede a las aplicaciones:**
   - **Frontend (Dashboard):** [http://localhost:5173](http://localhost:5173)
   - **Backend (API):** [http://localhost:3000](http://localhost:3000)

4. **Ver logs:**
   ```bash
   docker-compose logs -f
   ```
