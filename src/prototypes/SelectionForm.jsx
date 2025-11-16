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
      const ids = data.candidates.map((c) => c.paperId);
      setItems(ids);
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
    onNext({ chunk: data.chunk, answer: items });
  };

  const handleCantRank = () => {
    onNext({ chunk: data.chunk, answer: "CANT_RANK" });
  };

  return (
    <>
      <EmphCard
        sx={{
          minHeight: "600px",       // taller blue box
          display: "flex",
          flexDirection: "column",
          padding: "16px",
        }}
      >
        <Typography variant="body1" sx={{ mb: 2 }}>
          Sort the papers for{" "}
          <Link
            href={paperLink}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{ fontWeight: "bold" }}
          >
            {paperTitle}
          </Link>
          . Drag to reorder, then submit.
        </Typography>

        <Divider variant="middle" sx={{ mb: 2 }} />

        {/* Inner scrollable container */}
        <Box
          sx={{
            flex: 1,                 // takes remaining height of blue box
            width: "97%",            // nearly full width
            overflowY: "auto",       // vertical scroll
            backgroundColor: "#ceebffff",
            borderRadius: "8px",
            padding: "12px",
          }}
        >
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext items={items}>
              <Droppable id="single-sortable-list">
                {items.map((id) => {
                  const paper = paperMap.get(id);
                  return (
                    <SortableItem
                      key={id}
                      id={id}
                      content={
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                            {paper.title}
                          </Typography>
                          <Typography variant="body2">{paper.reason}</Typography>
                        </Box>
                      }
                      sx={{ width: "97%", marginBottom: "8px" }}
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
        <Button variant="text" color="error" onClick={handleCantRank} sx={{ m: 1 }}>
          Can't Rank
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
