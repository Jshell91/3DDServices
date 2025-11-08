# ✅ FASE 5: Testing & Validación - MANUAL CHECKLIST

## 🎯 Tests Completados Automáticamente:
- ✅ Servidor funcionando (puerto 3000)
- ✅ Migración SQL ejecutada correctamente
- ✅ Funciones backend implementadas
- ✅ Dashboard con pestañas cargado

## 🖥️ Tests Manuales del Dashboard:

### 1. 📊 Test: Dashboard Login y Overview
- [ ] Ir a: http://localhost:3000/admin
- [ ] Login con credenciales admin
- [ ] Verificar que "Maps Available" muestra el total correcto
- [ ] Verificar que la pestaña "Overview" funciona

### 2. 🗺️ Test: Maps Management Tab
- [ ] Hacer clic en pestaña "Maps Management"
- [ ] Verificar que se carga la tabla de maps
- [ ] Verificar que muestra columna "Order" con valores
- [ ] Verificar que muestra TODOS los maps (visibles e invisibles)

### 3. 🎯 Test: Display Order Manual Edit
- [ ] Hacer clic en botón "✏️ Edit" de cualquier map
- [ ] Cambiar el order a un valor específico (ej: 5)
- [ ] Hacer clic en "Save"
- [ ] Verificar mensaje de éxito
- [ ] Verificar que la tabla se reordena automáticamente

### 4. 🔄 Test: Drag & Drop Reordering
- [ ] Agarrar el ícono "⋮⋮" de un map
- [ ] Arrastrarlo a una nueva posición
- [ ] Soltar el map
- [ ] Verificar mensaje "Saving new order..."
- [ ] Verificar mensaje "Order updated successfully!"
- [ ] Verificar que los números de order se actualizaron

### 5. ⚠️ Test: Validación de Duplicados
- [ ] Editar un map con order que YA existe en otro map
- [ ] Ejemplo: Si hay map con order=3, poner otro map en order=3
- [ ] Verificar que el map original se incrementa automáticamente a 4
- [ ] Verificar que no hay dos maps con el mismo order

### 6. 🚫 Test: Validación de Valores Inválidos
- [ ] Intentar editar order a 0
- [ ] Verificar que muestra error: "Order must be greater than 0"
- [ ] Intentar editar order a valor negativo (-1)
- [ ] Verificar que muestra error

### 7. 🔍 Test: API Endpoints
#### Endpoint Público (solo visibles):
```
GET http://localhost:3000/maps
```
- [ ] Debe devolver solo maps con `visible_map_select = true`
- [ ] Debe estar ordenado por `display_order ASC`

#### Endpoint Admin (todos los maps):
```
GET http://localhost:3000/admin/api/maps
```
- [ ] Debe devolver TODOS los maps
- [ ] Debe estar ordenado por `display_order ASC`

### 8. 📱 Test: Responsividad
- [ ] Cambiar tamaño de ventana
- [ ] Verificar que la tabla se adapta
- [ ] Verificar que el drag & drop funciona en pantalla pequeña

## 🎉 Tests de Aceptación Final:

### Escenario 1: Reordenar completamente
- [ ] Mover el map que está en posición 1 a la posición 5
- [ ] Verificar que todos los orders intermedios se ajustan
- [ ] Recargar página y verificar que el orden se mantiene

### Escenario 2: Duplicado automático
- [ ] Tener maps en orders: 1, 2, 3, 4, 5
- [ ] Cambiar map ID=X a order=3
- [ ] Verificar resultado: 1, 2, 3(nuevo), 4(era 3), 5(era 4), 6(era 5)

### Escenario 3: Auto-asignación
- [ ] Crear nuevo map sin especificar display_order
- [ ] Verificar que se asigna automáticamente MAX + 1

## ✅ Criterios de Éxito:
- [ ] Todos los maps se muestran ordenados por display_order
- [ ] Drag & drop funciona sin errores
- [ ] Edición manual funciona con validaciones
- [ ] Duplicados se resuelven automáticamente
- [ ] No se permiten valores <= 0
- [ ] Cambios se persisten en base de datos
- [ ] Dashboard es responsive y usable

## 🚀 Estado Final:
- [ ] ✅ FASE 1: Base de Datos - COMPLETA
- [ ] ✅ FASE 2: Backend - COMPLETA  
- [ ] ✅ FASE 3: API Endpoints - COMPLETA
- [ ] ✅ FASE 4: Frontend - COMPLETA
- [ ] ⏳ FASE 5: Testing - EN PROGRESO
- [ ] ⏳ FASE 6: Documentación - PENDIENTE

---
**Notas:** Una vez completados todos los tests manuales, la funcionalidad display_order estará lista para producción.
