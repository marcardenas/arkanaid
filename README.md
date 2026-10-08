# Arkanaid

Un Arkanoid neón, en el navegador, hecho para que cueste soltarlo. HTML5 Canvas + JavaScript puro, sin dependencias ni build.

## Jugar

Abre `index.html` en el navegador, o sirve la carpeta:

```bash
python3 -m http.server 8000
```

y entra a http://localhost:8000. Funciona en escritorio y en el celular.

**Controles:** mouse, arrastrar el dedo o ← → para mover · clic, toque o Espacio para lanzar o disparar · P/Esc para pausar · M para la música.

## Mecánicas

- **Slice:** si golpeas la bola mientras la paleta se desliza, sale con efecto y curva su trayectoria. Más velocidad significa más curva; las paredes y los ladrillos amortiguan el efecto.
- **Combo y multiplicador:** cada ladrillo que rompes sin tocar la paleta sube el combo (hasta x8). Cada nota sube por una escala pentatónica.
- **FIEBRE:** al llenar la barra superior tienes puntos x2, bola de fuego y la música se acelera.
- **15 cápsulas:** expandir, multibola, láser, atrapar, lento, bola de fuego, megabola, barrera, imán, puntos x2, lluvia de oro, vida extra, warp, y dos cápsulas malas (encoger, acelerar) que dan +500 pts por valiente.
- **10 tipos de ladrillo:** normal, duro, muy duro, metal, oro, explosivo (en cadena), regenerativo, móvil, invisible, cofre de monedas y misterio.
- **Drones** que bajan flotando y **3 jefes** con fases, disparos que aturden la paleta e invocación de drones.
- **Juice:** partículas, temblor de pantalla, hit-stop, cámara lenta en el último ladrillo, estelas, ondas expansivas y un marcador que sube rodando.

## Modos

- **Campaña:** 15 niveles hechos a mano con 3 jefes y hasta 3 estrellas por nivel (sin morir + bajo el tiempo par).
- **Infinito:** niveles procedurales simétricos que se ponen más difíciles, con un jefe cada 5 niveles.
- **Desafío diario:** la misma semilla para todos ese día, con 2 vidas y sin continuar.

## Progresión

- **Monedas:** se recogen en partida y también salen de recompensas, logros, puntaje y el bono diario por racha.
- **Tienda:** 11 mejoras permanentes (paleta ancha, vidas, duración, suerte, guardacombo, codicia, red de seguridad, ventaja inicial, imán, fiebre, láser rápido) y 12 estilos de bola y paleta.
- **25 logros** con recompensa, más estadísticas globales.
- **Continuar** gastando monedas, con costo creciente, y una vida extra cada 50.000 puntos.

El progreso se guarda en `localStorage`.

## Estructura

```
index.html      pantallas (DOM) + canvas
css/style.css   estilos de la interfaz
js/storage.js   guardado
js/audio.js     efectos y música sintetizados con WebAudio
js/data.js      niveles, ladrillos, power-ups, mejoras, estilos, logros, generador procedural
js/game.js      motor: física, entidades, jefes, render
js/ui.js        menús, tienda, logros, resultados
```
