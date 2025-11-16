import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { NormalCard } from "./Cards";
import Box from "@mui/material/Box";
import { Typography } from "@mui/material";

// Generic draggable card (optional)
function Draggable(props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: "draggable",
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <Box sx={{ maxWidth: 500 }}>
      <div ref={setNodeRef}>
        <NormalCard style={style} {...listeners} {...attributes}>
          Draggable Card
        </NormalCard>
      </div>
    </Box>
  );
}

// Sortable item for ranking papers

function SortableItem({ id, content, sx }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: transform ? `translate3d(0px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
    ...sx,
  };

  return (
    <Box ref={setNodeRef}>
      <NormalCard style={style} {...listeners} {...attributes} sx={{ width: "100%" }}>
        {content} {/* Can be JSX */}
      </NormalCard>
    </Box>
  );
}

export { Draggable, SortableItem };