import React, { useState, useEffect } from "react";
import { Box, Button, Typography, Divider, Alert } from "@mui/material";
import { EmphCard } from "../components/Cards";
import Link from "@mui/material/Link";
import { DndContext, PointerSensor, useSensor, useSensors, KeyboardSensor } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import { Droppable } from "../components/Droppable";
import { SortableItem } from "../components/Draggable";

function SelectionForm({ data, onNext }) {
  const [items, setItems] = useState([]);
  const [alertOpen, setAlertOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (data?.candidates) {
      // Insert separators as special items at the top
      const separators = ["separator-most", "separator-medium", "separator-low"];
      const paperIds = data.candidates.map((c) => c.paperId);
      setItems([...separators, ...paperIds]);
      setAlertOpen(false);
    }
  }, [data]);

  if (!data) return null;

  const paperLink = data.paperLink;
  const paperTitle = data.paperTitle;

  const paperMap = new Map(data.candidates.map((c) => [c.paperId, c]));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.indexOf(active.id);
        const newIndex = prev.indexOf(over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = () => {
    if (items.length === 0) {
      setAlertOpen(true);
      return;
    }
    const papersOnly = items.filter((id) => !id.startsWith("separator-"));
    onNext({ chunk: data.chunk, answer: papersOnly });
  };

  const handleCantRank = () => {
    onNext({ chunk: data.chunk, answer: "CANT_RANK" });
  };

  // Render content for separators or papers
  const renderContent = (id) => {
    if (id === "separator-most")
      return (
        <Box sx={{ py: 0.25, px: 1 }}>
          <Typography sx={{ fontWeight: "bold", fontSize: "0.75rem", lineHeight: 1.1 }}>
            Most Impact
          </Typography>
          <Typography sx={{ fontSize: "0.7rem", lineHeight: 1.1, color: "text.secondary" }}>
            Papers without which it would not have been possible to write {paperTitle}.
          </Typography>
        </Box>
      );

    if (id === "separator-medium")
      return (
        <Box sx={{ py: 0.25, px: 1 }}>
          <Typography sx={{ fontWeight: "bold", fontSize: "0.75rem", lineHeight: 1.1 }}>
            Medium Impact
          </Typography>
          <Typography sx={{ fontSize: "0.7rem", lineHeight: 1.1, color: "text.secondary" }}>
            Papers that helped write {paperTitle}, but were not fundamental. Alternatives could have been used.
          </Typography>
        </Box>
      );

    if (id === "separator-low")
      return (
        <Box sx={{ py: 0.25, px: 1 }}>
          <Typography sx={{ fontWeight: "bold", fontSize: "0.75rem", lineHeight: 1.1 }}>
            Lowest Impact
          </Typography>
          <Typography sx={{ fontSize: "0.7rem", lineHeight: 1.1, color: "text.secondary" }}>
            Papers that provided background information or helped define concepts in {paperTitle}.
          </Typography>
        </Box>
      );

    const paper = paperMap.get(id);
    return (
      <Box sx={{ py: 0.5, px: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: "bold", fontSize: "0.9rem", lineHeight: 1.2 }}
        >
          {paper.title}
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontSize: "0.8rem", color: "text.secondary", lineHeight: 1.2 }}
        >
          {paper.reason}
        </Typography>
      </Box>
    );
  };

  return (
    <>
      <EmphCard sx={{ minHeight: "600px", display: "flex", flexDirection: "column", padding: "16px" }}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Sort the papers for{" "}
          <Link href={paperLink} target="_blank" rel="noopener noreferrer" underline="hover" sx={{ fontWeight: "bold" }}>
            {paperTitle}
          </Link>
           based on the impact they had on it. Drag to reorder the papers and place them under the appropriate impact category (Most, Medium, or Lowest Impact).
        </Typography>

        <Divider variant="middle" sx={{ mb: 2 }} />

        <Box sx={{ flex: 1, width: "97%", overflowY: "auto", borderRadius: "8px", padding: "8px" }}>
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext items={items}>
              <Droppable id="single-sortable-list">
                {items.map((id) => (
                  <SortableItem
                    key={id}
                    id={id}
                    content={renderContent(id)}
                    sx={{
                      width: "97%",
                      marginBottom: "6px",
                      backgroundColor: id.startsWith("separator-") ? "#d0d0d0" : "#ffffff",
                      borderRadius: "4px",
                      py: id.startsWith("separator-") ? 0.5 : 0.5,
                      px: 1,
                      cursor: id.startsWith("separator-") ? "grab" : "pointer",
                    }}
                  />
                ))}
              </Droppable>
            </SortableContext>
          </DndContext>
        </Box>
      </EmphCard>

      <Box sx={{ textAlign: "center", width: "100%", mt: 2 }}>
        <Button variant="contained" onClick={handleSubmit} sx={{ m: 1 }}>
          Submit Order
        </Button>
      </Box>

      {alertOpen && (
        <Alert severity="warning" onClose={() => setAlertOpen(false)} sx={{ mt: 2 }}>
          Please reorder the list before submitting.
        </Alert>
      )}
    </>
  );
}

export default SelectionForm;
