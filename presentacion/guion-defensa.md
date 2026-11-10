# Guion de la defensa · Testia

Notas del orador de cada diapositiva de [`Testia-Defensa_UD1.pdf`](Testia-Defensa_UD1.pdf) (15 diapositivas, en el orden de la rúbrica). Los tiempos son orientativos: ≈10 min de exposición y ≈5 min de demo.

## 1. Testia

Presentación (≈30 s). Soy Juan Amador y he hecho la práctica de forma individual. Testia convierte unos apuntes en un test de repaso con IA. La práctica evalúa sobre todo la explotación: desplegar, securizar, probar y operar, más que el desarrollo. Por eso voy a seguir el orden de la rúbrica: primero la app y su alcance, luego Vercel con Clerk, después Docker y AWS, la seguridad, una incidencia real, el historial Git y, al final, la demo en los dos entornos.

## 2. Sigo el orden de lo que se evalúa
*Guion de la defensa*

(≈30 s) Este es el mapa de la defensa: cada bloque corresponde a un criterio de la rúbrica, con sus puntos. Casi el 70 % de la nota está en Vercel, Docker y AWS, así que es donde dedico más tiempo. La app es deliberadamente pequeña porque su complejidad no suma puntos.

## 3. Una pantalla, un formulario, una operación de IA
*Aplicación mínima · 1,0 puntos*

(≈45 s) Cumple el alcance mínimo: backend FastAPI que llama a una API real de IA (OpenRouter, con modelos gratuitos) y devuelve JSON; SPA en React con TypeScript y Tailwind; un formulario con validación, indicador de carga y errores comprensibles. La salida del modelo se valida con Pydantic: 4 opciones, una correcta, feedback por opción. Hay 7 tests con pytest y la IA simulada: entrada válida, entrada incorrecta (422), fallo del proveedor (502), JSON inválido, sin token (401), configuración de Clerk incompleta (503) y el comodín de orígenes. Lo que NO hace es intencionado: el enunciado prohíbe bases de datos, gestión propia de usuarios y funcionalidades que desvíen el esfuerzo del despliegue. La captura es la versión v1.1 en producción con sesión iniciada.

## 4. El navegador nunca habla con la IA
*Aplicación mínima · arquitectura*

(≈45 s) Recorrido: la SPA inicia sesión con Clerk y obtiene un token de sesión de vida corta; lo envía como Authorization: Bearer a POST /api/generar. FastAPI valida el token antes de nada y solo entonces llama a OpenRouter con su clave, que solo existe en el servidor. El mismo código FastAPI corre en los dos entornos: en Vercel como una función que se arranca por petición y con la SPA en la CDN; en EC2 como un proceso uvicorn permanente dentro de un contenedor que sirve también la SPA. En EC2 no hay HTTPS (simplificación permitida por el enunciado): por eso solo uso cuentas y textos de prueba, y lo explico en el README.

## 5. Un único proyecto: SPA en la CDN, FastAPI como función
*Vercel · 2,5 puntos*

(≈45 s) Frontend y backend están en UN único proyecto de Vercel, como exige el enunciado. Vercel detecta FastAPI por el entrypoint declarado en pyproject.toml y lo ejecuta como una sola Vercel Function con runtime Python; la SPA compilada la sirve la CDN. vercel.json define el comando de compilación del frontend y amplía el tiempo máximo de la función a 60 s, porque generar 10 preguntas con un modelo gratuito puede tardar. .vercelignore es clave: sin repositorio Git al principio, la CLI no aplicaba el .gitignore y llegó a subir el .env (incidencia documentada); desde entonces se excluyen secretos y artefactos. En el panel se ve el despliegue de producción Ready creado con vercel deploy y, en Observability, peticiones a la CDN e invocaciones de la función del mismo proyecto.

## 6. Todo el ciclo, desde la terminal
*Vercel · operaciones reales de CLI*

(≈45 s) El enunciado pide operaciones reales con la CLI, no solo instalarla. Vinculé el proyecto con vercel link; subí los secretos con vercel env add --sensitive leyendo el valor por la entrada estándar, para que nunca aparezca en el comando ni en el historial; con vercel env ls compruebo nombres y entornos sin ver valores. Cada versión pasa primero por una Preview (vercel deploy), la compruebo y después vercel deploy --prod. vercel logs me sirvió para diagnosticar: así vi el 403 de OpenRouter y, en noviembre, que tras rotar la clave OpenRouter respondía 200. Con vercel api consulté la lista de archivos de cada despliegue para asegurar que no viajaba el .env. Todos los comandos, con su resultado, están en la sección 6 del README.

## 7. Ocultar el botón no protege: FastAPI valida cada token
*Vercel · Clerk y redespliegue*

(≈1 min) Clerk se integró después del primer despliegue y se volvió a desplegar, como pide el enunciado. La SPA usa @clerk/react: Iniciar sesión, Crear cuenta y Cerrar sesión. Pero ocultar el botón no protege nada: quien protege la IA es FastAPI. La dependencia usuario_autenticado usa el SDK oficial clerk-backend-api: descarga la JWKS con la clave secreta, comprueba la firma, exp/nbf, que sea un token de sesión y que el origen (azp) esté en CLERK_AUTHORIZED_PARTIES, con un valor por entorno. Sin token o con un token inventado: 401 con WWW-Authenticate: Bearer, y la IA no se llama (lo cubre un test). En la revisión de noviembre añadí que, si falta la configuración de Clerk, responde 503 en lugar de aceptar cualquier origen. Los logs solo guardan el motivo del rechazo, nunca el token. La instancia es de desarrollo, como indica el enunciado; solo oculto la etiqueta visual de “Development mode”.

## 8. Una imagen, un contenedor, la app completa
*Docker y AWS · 3,0 puntos*

(≈45 s) Un único contenedor con la app completa, construido en dos etapas: la primera compila la SPA con Node y la descarta; la segunda, con Python slim, ejecuta FastAPI, que sirve a la vez la API y los estáticos. Los secretos nunca entran en la imagen: se inyectan al arrancar con --env-file; la única variable de compilación es la clave PÚBLICA de Clerk, que de todos modos acaba en el navegador. Comprobado: ningún secreto en docker history, proceso como usuario app y estado healthy. uvicorn escucha en 0.0.0.0 porque con 127.0.0.1 no llegaría el tráfico del puerto publicado. La etiqueta de la imagen es el commit, así docker ps dice qué versión corre. Lo probé en local en el puerto 8080 con inicio de sesión, test generado y 401 sin token, y también parar e iniciar el contenedor.

## 9. Creado con la AWS CLI, solo lo necesario abierto
*Docker y AWS · EC2*

(≈1 min) Todo se creó con la AWS CLI desde PowerShell para que sea reproducible: par de claves ED25519 propio, Security Group, instancia con la AMI más reciente de Amazon Linux 2023 leída de SSM, disco gp3 de 16 GiB, IMDSv2 obligatorio y una IP elástica, porque el Learner Lab detiene la instancia y sin IP fija cambiarían la URL y los orígenes de Clerk. El t3.micro lleva 2 GiB de swap para poder compilar la SPA. En el Security Group solo hay dos reglas de entrada: SSH desde mi IP con máscara /32 y HTTP 80 público para la demo. No se abren el 8000 (interno del contenedor) ni la API de Docker (2375/2376): lo comprobé desde fuera con Test-NetConnection. Las variables están en un archivo privado fuera del repositorio, con permisos 600, creado enviando el contenido por SSH para que los valores no queden en el historial. Limitación: es HTTP sin cifrar, permitido por el enunciado; solo cuentas y textos de prueba. Para administrar desde otro equipo sin copiar la clave privada uso EC2 Instance Connect con una clave efímera y una regla SSH temporal que revoco al terminar (incidencia 15).

## 10. Estado, reinicio y actualización, comprobados
*Docker y AWS · operación*

(≈45 s) La operación está comprobada, no solo descrita. docker ps muestra el contenedor healthy gracias al HEALTHCHECK contra /api/health, y docker logs registra los accesos y el motivo de cada rechazo, sin datos sensibles. docker restart y un reinicio completo de la instancia: el contenedor vuelve solo por la política unless-stopped. Para actualizar: git fetch y checkout del nuevo tag, docker build con la etiqueta del commit, sustituir el contenedor y probar; así pasé EC2 de c1347c2 a 55ccc4d (v1.0-aws), y hasta el prune la imagen anterior sirve para volver atrás. En Vercel el flujo equivalente es Preview, comprobación y --prod. Retirada de recursos: terminar la instancia (borra el disco), liberar la IP elástica, que sin usar sigue costando, y borrar el Security Group y el par de claves. En noviembre repetí el procedimiento para pasar EC2 a v1.1-vercel (testia:55ccc4d → testia:0406d72), antes actualizando en testia.env la clave y los modelos de OpenRouter; la imagen anterior sigue disponible para volver atrás.

## 11. Solo la clave pública de Clerk llega al navegador
*Seguridad y configuración · 1,0 puntos*

(≈45 s) Ningún secreto está en el código, el repositorio ni la imagen: en local viven en .env (ignorado por Git, por Docker y por Vercel; solo se publica .env.example con valores de ejemplo), en Vercel como variables sensitive y en EC2 en un archivo con permisos 600. La única variable que llega al navegador es la clave pública de Clerk, que se incrusta al compilar; por eso, si cambia, hay que recompilar o reconstruir la imagen. La autenticación se valida en el backend: 401 sin token o con token inventado, comprobado en Vercel y en EC2, y 503 si falta configuración. En red, solo el puerto 80 es público y el SSH está limitado a mi IP. Antes de la entrega revisé el árbol de trabajo y todo el historial de Git buscando claves: limpio. Las capturas tienen ocultos IDs, IPs y datos personales. Y como el .env llegó a subirse a Vercel una vez, la clave se rotó.

## 12. La IA dejó de responder en producción
*Documentación · una incidencia real*

(≈1 min) Incidencia 14 del README, de esta última revisión. Síntoma: el test dejó de generarse; el usuario veía un error comprensible y FastAPI devolvía un 502 controlado, sin filtrar detalles. Diagnóstico: la clave de OpenRouter había caducado y, al consultar el catálogo público /api/v1/models, dos de los tres modelos gratuitos configurados ya no existían. Solución: clave nueva, subida a Vercel con vercel env rm y vercel env add --sensitive leyendo el valor por stdin; y probé los modelos gratuitos del día con una llamada real de 3 preguntas: nemotron-3.5-super-vl de NVIDIA como principal (unos 3 s), ultra-550b y dots-3 como respaldo; otros fallaban por 429, por no permitir desactivar el razonamiento o por devolver JSON mal anidado. De paso mejoré la lectura del JSON para tolerar texto después del objeto. Comprobación: Preview con /api/health y 401, después --prod, y en vercel logs las generaciones reales con OpenRouter 200 OK. Si preguntan por otra: TOKEN_NOT_ACTIVE_YET en Docker local por el reloj de Windows atrasado 34 s; se sincronizó la hora en vez de ampliar el margen de validación.

## 13. Un tag por hito y un README reproducible
*Documentación y Git · 1,0 puntos*

(≈45 s) Cada hito tiene un tag en un commit distinto y su release de GitHub, de v0.1 (backend con tests) a v1.0 (AWS); v1.1-vercel es la revisión de noviembre. El repositorio es público. Commits significativos, con mensajes que explican el cambio. Antes de documentar leí la guía Diátaxis para planificar la documentación: el README combina how-to (pasos por entorno), referencia (variables, comandos) y explicación (arquitectura y decisiones); quién lo lee, cómo se actualiza por hito y qué herramientas uso está en su sección 2. Las 15 incidencias están documentadas con síntoma, diagnóstico, solución y comprobación, solo reales. Al final del README hay un mapa de qué sección acredita cada criterio de la rúbrica. Transparencia: las fases 1–3 se hicieron antes de crear el repositorio y su historial se reconstruyó por fases con los ficheros reales; está explicado en la incidencia 9.

## 14. Demo en vivo: dos entornos, con sesión y sin ella
*Defensa y demo · 1,5 puntos*

(≈4–5 min) Antes de la defensa: Start Lab en AWS y, si hace falta, aws ec2 start-instances; comprobar http://54.235.82.94/api/health y https://testia.vercel.app/api/health; tener abiertos Vercel (proyecto testia), la consola de EC2, una terminal con SSH y otra con cuerpo.json para el curl. Usar una cuenta de prueba de Clerk, sin enseñar contraseñas. Vercel: sin sesión, el botón del formulario pide entrar y se ve Crear cuenta; iniciar sesión, Probar con un ejemplo, Generar test, responder dos preguntas para enseñar el feedback; Cerrar sesión. En terminal: curl -i -X POST https://testia.vercel.app/api/generar --data-binary @cuerpo.json → 401 con WWW-Authenticate: Bearer. En el dashboard: un único proyecto con CDN y función, y Environment Variables sin valores. EC2: lo mismo en http (avisar de que no es seguro, solo cuentas de prueba), curl sin token 401, por SSH docker ps (healthy, etiqueta = commit) y docker logs con los rechazos, docker restart y volver a cargar. En la consola: instancia running y reglas de entrada del Security Group. Los dos entornos ejecutan v1.1-vercel. Si falla algo externo (OpenRouter, Clerk, el lab de AWS), enseñar las capturas de evidencias/ y las salidas del README, explicando qué demuestra cada una.

## 15. Gracias

Cierre. Recordar dónde está cada cosa: repositorio público con tags y releases, las dos URLs con su versión desplegada, y el mapa de la rúbrica al final del README. Preguntas probables y respuesta corta: ¿Por qué no CORS? Porque SPA y API comparten origen en todos los entornos; CORS no sustituye a la autenticación. ¿Qué pasa si roban la clave pública de Clerk? Nada: es pública por diseño; lo secreto es la sk_ y la de OpenRouter. ¿Por qué IP elástica? El lab detiene la instancia y la URL y los orígenes de Clerk cambiarían. ¿Cómo sabes qué versión corre? Tag en Vercel y etiqueta de la imagen = commit en EC2. ¿Por qué HTTP en EC2? Simplificación permitida; documentada como limitación y solo con cuentas de prueba.
