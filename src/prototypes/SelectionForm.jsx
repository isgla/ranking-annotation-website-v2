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

  // Background colors for categories
  const categoryColors = {
    "separator-most": "#e5fae0ff",
    "separator-medium": "#e0f7fa",
    "separator-low": "#f3e5f5",
  };

  // Font colors for separators matching paper background
  const categoryFontColors = {
    "separator-most": "#267900ff", // Green
    "separator-medium": "#2b59ffff", // Blue
    "separator-low": "#6a1b9a", // dark purple
  };

  // Determine the current category for each paper
  const getCategory = (index) => {
    for (let i = index; i >= 0; i--) {
      const id = items[i];
      if (id.startsWith("separator-")) return id;
    }
    return null;
  };

  // Render content for separators or papers
  const renderContent = (id) => {
    if (id.startsWith("separator-")) {
      let title, description;
      if (id === "separator-most") {
        title = "Most Impact";
        description = `Papers without which it would not have been possible to write ${paperTitle}.`;
      } else if (id === "separator-medium") {
        title = "Medium Impact";
        description = `Papers that helped write ${paperTitle}, but were not fundamental. Alternatives could have been used.`;
      } else if (id === "separator-low") {
        title = "Lowest Impact";
        description = `Papers that provided background information or helped define concepts in ${paperTitle}.`;
      }

      return (
        <Box sx={{ py: 0.25, px: 1 }}>
          <Typography
            sx={{
              fontWeight: "bold",
              fontSize: "0.75rem",
              lineHeight: 1.1,
              color: categoryFontColors[id],
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{ fontSize: "0.7rem", lineHeight: 1.1, color: categoryFontColors[id] }}
          >
            {description}
          </Typography>
        </Box>
      );
    }

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
          . Drag to reorder and place papers under the appropriate impact category.
        </Typography>

        <Divider variant="middle" sx={{ mb: 2 }} />

        {/* Scrollable container */}
        <Box sx={{ flex: 1, width: "97%", overflowY: "auto", borderRadius: "8px", padding: "8px" }}>
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext items={items}>
              <Droppable id="single-sortable-list">
                {items.map((id, index) => {
                  const category = getCategory(index);
                  const bgColor = id.startsWith("separator-") ? "#d0d0d0" : categoryColors[category] || "#ffffff";
                  return (
                    <SortableItem
                      key={id}
                      id={id}
                      content={renderContent(id)}
                      sx={{
                        width: "97%",
                        marginBottom: "6px",
                        backgroundColor: bgColor,
                        borderRadius: "4px",
                        py: 0.5,
                        px: 1,
                        cursor: id.startsWith("separator-") ? "grab" : "pointer",
                      }}
                    />
                  );
                })}
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
