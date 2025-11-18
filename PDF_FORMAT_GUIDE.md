# Guía de Formato PDF para Extracción de Vocabulario

El sistema de extracción automática de vocabulario busca patrones específicos en el PDF. Para que funcione correctamente, sigue uno de estos formatos:

## ✅ Formatos Soportados

### Formato 1: Guión o Igual
```
hello - hola
goodbye - adiós
thank you - gracias
good morning = buenos días
```

### Formato 2: Dos Puntos
```
hello: hola
goodbye: adiós
thank you: gracias
```

### Formato 3: Barra
```
hello / hola
goodbye / adiós
thank you / gracias
```

### Formato 4: Entre Paréntesis
```
hello (hola)
goodbye (adiós)
thank you (gracias)
```

## 📋 Reglas Importantes

1. **Una palabra por línea**: Cada entrada debe estar en una línea diferente
2. **Palabra + Significado**: Debe haber claramente dos partes (la palabra y su significado)
3. **Palabras validas**: Entre 3 y 100 caracteres
4. **Significado valido**: Entre 3 y 200 caracteres
5. **Evitar**: Títulos, números de página, palabras como "Unit", "Page", "Copyright"

## ❌ Formatos NO Soportados

```
- Vocabulario sin separador claro
- Tablas sin separadores
- Palabras en múltiples líneas
- Nombres propios sin significado
```

## 📝 Ejemplo de PDF Correcto

```
VOCABULARY LESSON 1

hello - hola
goodbye - adiós
thank you - gracias
please - por favor
yes - sí
no - no
good morning - buenos días
good night - buenas noches
how are you - ¿cómo estás?
nice to meet you - mucho gusto
```

## 💡 Si el PDF no se extrae correctamente

1. Asegúrate de que el PDF es texto (no imagen escaneada)
2. Verifica que el formato sea uno de los soportados
3. Revisa que no haya caracteres especiales extraños
4. Prueba con un PDF más simple primero

## 🔧 Después de Extraer

Si la extracción automática no es perfecta:
1. Se abre el modal de "Review & Edit Vocabulary"
2. Puedes editar manualmente cada palabra
3. Puedes agregar o eliminar palabras
4. Luego guardas normalmente

¡El sistema es flexible y permite correcciones manuales!
