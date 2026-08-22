export const productosSeed = [
  { id: 1, codigo: 'PRD-001', nombre: 'Arroz Superior 5 kg', categoria: 'Abarrotes', precioCompra: 18.5, precioVenta: 24.9, stock: 42, stockMinimo: 10, proveedor: 'Distribuidora Andina' },
  { id: 2, codigo: 'PRD-002', nombre: 'Aceite Vegetal 1 L', categoria: 'Abarrotes', precioCompra: 6.2, precioVenta: 8.5, stock: 8, stockMinimo: 12, proveedor: 'Alicorp SAC' },
  { id: 3, codigo: 'PRD-003', nombre: 'Azúcar Estándar 1 kg', categoria: 'Abarrotes', precioCompra: 3.8, precioVenta: 5.0, stock: 65, stockMinimo: 15, proveedor: 'Agroindustrial Norte' },
  { id: 4, codigo: 'BEB-001', nombre: 'Gaseosa Cola 3 L', categoria: 'Bebidas', precioCompra: 7.0, precioVenta: 10.5, stock: 30, stockMinimo: 10, proveedor: 'Bebidas del Perú' },
  { id: 5, codigo: 'BEB-002', nombre: 'Agua San Mateo 625 ml', categoria: 'Bebidas', precioCompra: 0.9, precioVenta: 1.5, stock: 120, stockMinimo: 40, proveedor: 'Aje Group' },
  { id: 6, codigo: 'LIM-001', nombre: 'Detergente Polvo 800 g', categoria: 'Limpieza', precioCompra: 5.4, precioVenta: 7.9, stock: 5, stockMinimo: 12, proveedor: 'Química Lima' },
  { id: 7, codigo: 'PAN-001', nombre: 'Pan Ciabatta unidad', categoria: 'Panadería', precioCompra: 0.35, precioVenta: 0.6, stock: 90, stockMinimo: 30, proveedor: 'Panadería El Trigal' },
  { id: 8, codigo: 'SNK-001', nombre: 'Papas Fritas Clásicas 145 g', categoria: 'Snacks', precioCompra: 3.1, precioVenta: 4.5, stock: 48, stockMinimo: 15, proveedor: 'Snacks América' },
]

export const ventasSeed = [
  { id: 'V-1024', fecha: new Date().toISOString(), items: [{ nombre: 'Arroz Superior 5 kg', cantidad: 2, precioVenta: 24.9 }, { nombre: 'Aceite Vegetal 1 L', cantidad: 1, precioVenta: 8.5 }], total: 58.3, metodo: 'Efectivo' },
  { id: 'V-1023', fecha: new Date(Date.now() - 3600_000).toISOString(), items: [{ nombre: 'Gaseosa Cola 3 L', cantidad: 3, precioVenta: 10.5 }], total: 31.5, metodo: 'Yape / Plin' },
  { id: 'V-1022', fecha: new Date(Date.now() - 7200_000).toISOString(), items: [{ nombre: 'Pan Ciabatta unidad', cantidad: 6, precioVenta: 0.6 }], total: 3.6, metodo: 'Efectivo' },
]

export const movimientosSeed = [
  { id: 'MOV-501', tipo: 'Entrada', producto: 'Arroz Superior 5 kg', cantidad: 50, motivo: 'Compra a proveedor', fecha: new Date().toISOString(), estado: 'Validado' },
  { id: 'MOV-500', tipo: 'Salida', producto: 'Detergente Polvo 800 g', cantidad: 20, motivo: 'Merma / dañados', fecha: new Date(Date.now() - 3600_000).toISOString(), estado: 'Validado' },
  { id: 'MOV-499', tipo: 'Entrada', producto: 'Agua San Mateo 625 ml', cantidad: 120, motivo: 'Reposición semanal', fecha: new Date(Date.now() - 7200_000).toISOString(), estado: 'Pendiente' },
  { id: 'MOV-498', tipo: 'Ajuste', producto: 'Papas Fritas Clásicas 145 g', cantidad: -3, motivo: 'Inventario físico', fecha: new Date(Date.now() - 10800_000).toISOString(), estado: 'Validado' },
]

export const ventasSemana = [42, 55, 38, 61, 73, 89, 64]
