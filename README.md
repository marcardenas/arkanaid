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
- **☠ Modo Rogue** (se desbloquea al vencer al primer jefe, en el nivel 5): Arkanoid + roguelike.
  - **Mapa:** 3 actos con caminos que se bifurcan, al estilo de *Slay the Spire*. Cada sala es un combate, una élite, un evento, una tienda, un descanso, un tesoro o un jefe.
  - **Muerte permanente:** las vidas no se recuperan entre niveles. Si sales de un nivel a la mitad, pierdes una vida.
  - **26 reliquias:** comunes, raras y legendarias que se combinan entre sí (Hidra, Eco, Fénix, Cañón eterno…), más 4 maldiciones.
  - **Élites:** traen modificadores como Oscuridad, Blindados, Veloz, Regeneración, Enjambre o Paleta reducida.
  - **7 eventos:** con decisiones de riesgo y recompensa (Altar de sangre, Pacto oscuro, El apostador…).
  - **Fragmentos ◆:** se gastan en la tienda de la run. Al terminar, se convierten en monedas.
  - La run se guarda y puedes retomarla.

## Progresión

- **🔓 Desbloqueos de campaña:** cada nivel superado por primera vez desbloquea algo útil. El orden es:
  1. Árbol de habilidades
  2. Modo Infinito
  3. Segunda ranura de habilidad
  4. Desafío diario
  5. Modo Rogue
  6. Estilos
  7. +1 vida
  8. Mejoras avanzadas de tienda
  9. +1 al combo máximo
  10. +1 barrera
  11. +10% de monedas
  12. Cápsulas más lentas
  13. +10% de puntos
  14. Bola extra
  15. 500 monedas, 5 PH y la paleta Oro

  La pantalla de niveles muestra el premio de cada uno.
- **⬆ Nivel de cuenta:** ganas experiencia en todos los modos (por puntaje, niveles superados y jefes). Cada nivel da PH y monedas, y algunos niveles traen hitos:
  - Nv 5: +5% de puntos
  - **Nv 10: clase secundaria.** Da su bono al 50%, su habilidad y un segundo punto de partida en el árbol.
  - Nv 15: +1 vida
  - Nv 20: ranura extra de habilidad (tecla R)
  - Nv 25: secundaria al 100%
  - Nv 30: +15% de monedas
  - Nv 40: 2 PH por nivel
  - Nv 50: Leyenda
- **Monedas:** se recogen en partida y también salen de recompensas, logros, puntaje y el bono diario por racha.
- **Tienda:** 11 mejoras permanentes (paleta ancha, vidas, duración, suerte, guardacombo, codicia, red de seguridad, ventaja inicial, imán, fiebre, láser rápido) y 12 estilos de bola y paleta.
- **🌳 Árbol de habilidades gigante**, radial y al estilo del árbol de pasivas de Path of Exile 2. Se mueve arrastrando y se hace zoom con la rueda o pellizcando.
  - **326 nodos en 12 ramas independientes:** Paleta, Efecto, Bola, Piromancia, Enjambre, Poder, Combo, Fortuna, Cazador, Supervivencia, Cronos y Artillería.
  - **Tipos de nodo:** tránsitos, notables, una clave por rama y 6 nodos de *Trascendencia* entre ramas vecinas. También hay 24 **senderos sin salida** (Cúmulos ✦ y Joyas ❖) que terminan en un premio y no llevan a ningún otro nodo.
  - **Recorrido:** un anillo de puertas conecta todos los sectores, así que puedes viajar a cualquier rama. Un nodo se compra si está conectado a algo que ya tienes.
  - **8 clases**, cada una con su punto de partida, un bono pasivo y una habilidad propia: Titán (bola), Mercader (dinero), Enjambre (muchas bolas), Artillero (láser), Guardián (defensa), Piromante (explosiones), Cronomante (tiempo) y Tejedor (slice). Cambiar de clase reinicia el árbol y devuelve los PH.
  - **10 habilidades activas** que se desbloquean en el árbol. Equipas 2 y las usas con **Q / E** o tocándolas en pantalla, cada una con su recarga: Pulso, Llamada, Aspirar, Bombardeo, Dividir, Barrera, Fiebre, Lluvia de oro, Tiempo bala y Rayo.
  - **Puntos de habilidad (PH):** se ganan en la campaña. Das 1 por cada estrella nueva, 3 por cada jefe derrotado por primera vez y 1 por cada 3.000 puntos. Se puede reiniciar gratis. Los bonos se suman a los de las reliquias y aplican en todos los modos.
- **28 logros** con recompensa, más estadísticas globales.
- **Continuar** gastando monedas, con costo creciente, y una vida extra cada 50.000 puntos.

El progreso se guarda en `localStorage`.

## Estructura

```
index.html      pantallas (DOM) + canvas
css/style.css   estilos de la interfaz
js/storage.js   guardado
js/audio.js     efectos y música sintetizados con WebAudio
js/data.js      niveles, ladrillos, power-ups, mejoras, estilos, logros, generador procedural
js/skills.js    árbol de habilidades
js/rogue.js     modo Rogue: mapa, reliquias, eventos, tienda
js/game.js      motor: física, entidades, jefes, render
js/ui.js        menús, tienda, logros, resultados
```
