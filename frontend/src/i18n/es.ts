export const es = {
  app: {
    title: "skeleton",
    subtitle: "FastAPI + uv · Vite + React + Tailwind/shadcn",
  },
  navigation: {
    label: "Navegacion principal",
    items: {
      dashboard: "Dashboard",
      examples: "Ejemplos",
      status: "Estado",
    },
  },
  dashboard: {
    title: "Punto de partida",
    description:
      "Usa este dashboard como resumen y acceso a vistas. Mueve el trabajo real a vistas dedicadas por feature.",
    examplesTitle: "Listado de feature",
    examplesDescription:
      "Un patron reemplazable de listado para la primera area de negocio de la app.",
    statusTitle: "Estado runtime",
    statusDescription:
      "Revisa que el frontend todavia pueda comunicarse con el backend FastAPI.",
    openExamples: "Abrir listado",
    openStatus: "Revisar estado",
  },
  examples: {
    title: "Feature de ejemplo",
    description:
      "Reemplaza este placeholder por el primer listado real de la app, sus detalles y su flujo de crear o editar.",
    create: "Crear item",
    itemColumn: "Item",
    statusColumn: "Estado",
    rowDescription: "Fila placeholder para datos especificos de la app.",
    rows: {
      draft: "Item en borrador",
      review: "Item en revision",
      done: "Item completado",
    },
  },
  status: {
    title: "Estado runtime",
    description:
      "Esta vista verifica que el frontend y el backend puedan comunicarse.",
    cardTitle: "Conexion backend",
    cardDescription: "El estado se actualiza cuando llegan eventos realtime.",
    loading: "Conectando...",
    ok: "API conectada",
    error: "API no disponible",
  },
  notFound: {
    title: "Vista no encontrada",
    description: "Esta ruta no forma parte del shell de la app.",
    action: "Volver al dashboard",
  },
};
