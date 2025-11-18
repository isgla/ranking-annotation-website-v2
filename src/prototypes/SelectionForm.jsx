// Updated SelectionForm.jsx
// PHASED VERSION: Phase 1 = sort papers, Phase 2 = insert separators

import React, { useState, useEffect } from "react";
import { Box, Button, Typography, Divider, Alert, Link } from "@mui/material";
import { EmphCard } from "../components/Cards";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  KeyboardSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import { Droppable } from "../components/Droppable";
import { SortableItem } from "../components/Draggable";

import { useRef } from "react";

function SelectionForm({ data, onNext }) {
  const latestSortedRef = useRef([]);
  const [items, setItems] = useState([]);
  const [alertOpen, setAlertOpen] = useState(false);
  const [phase, setPhase] = useState("sorting"); // NEW

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (data?.candidates) {
      const paperIds = data.candidates.map((c) => c.paperId);

      if (phase === "sorting") {
        // initialize sorting list from payload
        setItems(paperIds); // ONLY papers in phase 1
        // also update latestSortedRef so we have a fallback
        latestSortedRef.current = paperIds.slice();
      } else if (phase === "categorizing") {
        const separators = [
          "separator-most",
          "separator-medium",
          "separator-low",
        ];
        // use the user's sorted order if available, otherwise default to payload order
        const base = (latestSortedRef.current && latestSortedRef.current.length) ? latestSortedRef.current : paperIds;
        setItems([...separators, ...base]);
      }

      setAlertOpen(false);
    }
  }, [data, phase]);

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

    let currentCategory = null;
    const paperWithCategory = [];

    items.forEach((id) => {
      if (id === "separator-most") currentCategory = "most-impactful";
      else if (id === "separator-medium") currentCategory = "medium-impactful";
      else if (id === "separator-low") currentCategory = "lowest-impactful";
      else paperWithCategory.push([id, currentCategory]);
    });

    onNext({ chunk: data.chunk, answer: paperWithCategory });
  };

  const handleCantRank = () => {
    onNext({ chunk: data.chunk, answer: "CANT_RANK" });
  };

  const getPaperColor = (paperId) => {
    if (phase === "sorting") return "#ffffff";

    const index = items.indexOf(paperId);
    if (index === -1) return "#ffffff";

    let category = null;
    for (let i = index - 1; i >= 0; i--) {
      const id = items[i];
      if (id === "separator-most") {
        category = "most-impactful";
        break;
      }
      if (id === "separator-medium") {
        category = "medium-impactful";
        break;
      }
      if (id === "separator-low") {
        category = "lowest-impactful";
        break;
      }
    }

    if (category === "most-impactful") return "#e5fae0ff";
    if (category === "medium-impactful") return "#e0f7fa";
    if (category === "lowest-impactful") return "#f3e5f5";
    return "#ffffff";
  };

  const getFontColor = (categoryId) => {
    if (categoryId === "separator-most") return "#267900ff";
    if (categoryId === "separator-medium") return "#2b59ffff";
    if (categoryId === "separator-low") return "#4b0082";
    return "#000000";
  };

  const renderContent = (id) => {
    if (phase === "sorting" && id.startsWith("separator-")) return null;

    if (id === "separator-most")
      return (
        <Box sx={{ py: 0.25, px: 1 }}>
          <Typography sx={{ fontWeight: "bold", fontSize: "0.75rem", lineHeight: 1.1, color: getFontColor(id) }}>
            High-impact citations
          </Typography>
          <Typography variant="body2" sx={{ fontSize: "0.7rem", color: "black", mt: 0.25 }}>
            <strong>High-impact citations:</strong> These are the papers <strong>without which your own work would not have been possible.</strong> They supply essential conceptual, methodological, or operational ingredients.<br/>
            Useful criteria:<br/>
            • Conceptual or operational indispensability: The reference provides a <strong>unique</strong> conceptual insight, methodological innovation, dataset, or technique that is directly instrumental to your paper. Examples: a specific algorithm your method extends; a benchmark or dataset your study critically depends on; a theoretical formulation your contribution builds on.<br/>
            • Organic necessity: The reference is uniquely and genuinely required for a reader to understand how your paper works or how its core logic unfolds. Without this citation, the intellectual lineage of your method would be opaque or incomplete.<br/>
            • Typical quantity: 1–5 papers (or even 1).
          </Typography>
        </Box>
      );

    if (id === "separator-medium")
      return (
        <Box sx={{ py: 0.25, px: 1 }}>
          <Typography sx={{ fontWeight: "bold", fontSize: "0.75rem", lineHeight: 1.1, color: getFontColor(id) }}>
            Medium-impact citations
          </Typography>
          <Typography variant="body2" sx={{ fontSize: "0.7rem", color: "black", mt: 0.25 }}>
            <strong>Medium-impact citations:</strong> These are papers that helped you write your paper, but <strong>were not fundamentally irreplaceable.</strong> You could have used an alternative prior work or formulation, but you chose this one because it was particularly useful, clear, or canonical.<br/>
            Useful criteria:<br/>
            • Conceptual or operational contribution (non-unique): The reference conveys an idea, dataset, or model family that meaningfully helped your setup, but other comparable alternatives exist. Examples: selecting LLaMA‑1 vs LLaMA‑2; choosing one evaluation protocol among several similar ones; relying on one of several formulations of a known concept.<br/>
            • Organic helpfulness: The reference is genuinely helpful for understanding your paper, but not uniquely necessary. It situates your work clearly, but your contribution does not hinge on this specific citation.<br/>
            • Typical quantity: roughly 5–15 papers.
          </Typography>
        </Box>
      );

    if (id === "separator-low")
      return (
        <Box sx={{ py: 0.25, px: 1 }}>
          <Typography sx={{ fontWeight: "bold", fontSize: "0.75rem", lineHeight: 1.1, color: getFontColor(id) }}>
            Low-impact citations
          </Typography>
          <Typography variant="body2" sx={{ fontSize: "0.7rem", color: "black", mt: 0.25 }}>
            <strong>Low-impact citations:</strong> These citations provide <strong>background, context, or perfunctory acknowledgement</strong>, but the core contribution of your paper is not dependent on them in any strong way.<br/>
            Useful criteria:<br/>
            • Background or definitional citations: References used to define a task, introduce a general problem area, or acknowledge standard terminology. The same role could have been fulfilled by many other papers.<br/>
            • Perfunctory or field‑signaling citations: The reference mainly signals that prior work exists in the broad area. The citing paper does not substantively depend on the specific ideas of the cited work.<br/>
            • Typical quantity: the majority of citations.
          </Typography>
        </Box>
      );

    const paper = paperMap.get(id);
    return (
      <Box sx={{ py: 0.25, px: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: "bold", fontSize: "0.7rem", lineHeight: 1.2 }}>
          {paper.title}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "black", lineHeight: 1.2 }}>
          {paper.reason}
        </Typography>
      </Box>
    );
  };

  return (
    <>
      <EmphCard sx={{ minHeight: "600px", display: "flex", flexDirection: "column", padding: "16px" }}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Please sort the papers you cited in {" "}
          <Link href={paperLink} target="_blank" rel="noopener noreferrer" underline="hover" sx={{ fontWeight: "bold" }}>
            {paperTitle}
          </Link>
          based on their impact on your paper. Drag to reorder. High impact citations are papers without which your own work would not have been possible.
          They supply essential conceptual, methodological, or operational ingredients. And low impact citations provide background, context, 
          or perfunctory acknowledgement, but the core contribution of your paper is not dependent on them in any strong way.
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
                      backgroundColor: id.startsWith("separator-") ? "#d0d0d0" : getPaperColor(id),
                      borderRadius: "4px",
                      py: 0.25,
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

      {phase === "sorting" && (
        <Box sx={{ textAlign: "center", width: "100%", mt: 2 }}>
          <Button variant="contained" onClick={() => { latestSortedRef.current = items.filter(id => !id.startsWith('separator-')); setPhase("categorizing"); }} sx={{ m: 1 }}>
            Add Impact Categories
          </Button>
        </Box>
      )}

      {phase === "categorizing" && (
        <Box sx={{ textAlign: "center", width: "100%", mt: 2 }}>
          <Button variant="contained" onClick={handleSubmit} sx={{ m: 1 }}>
            Submit
          </Button>
        </Box>
      )}

      {alertOpen && (
        <Alert severity="warning" onClose={() => setAlertOpen(false)} sx={{ mt: 2 }}>
          Please reorder the list before submitting.
        </Alert>
      )}
    </>
  );
}

export default SelectionForm;
