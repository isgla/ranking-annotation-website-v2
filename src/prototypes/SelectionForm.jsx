import React, { useState, useEffect } from "react";
import { Box, Button, Typography, Divider, Alert, List, ListItem, ListItemText, Checkbox, FormControlLabel } from "@mui/material";
import { EmphCard } from "../components/Cards";
import Link from "@mui/material/Link";

function SelectionForm({ data, onNext }) {
  const [selected, setSelected] = useState(new Set());
  const [alertOpen, setAlertOpen] = useState(false);

  useEffect(() => {
    // reset when data changes
    setSelected(new Set());
    setAlertOpen(false);
  }, [data]);

  if (!data) return null;

  const paperId = data.paperId;
  const paperLink = data.paperLink;
  const paperTitle = data.paperTitle;

  const handleToggle = (candidateId) => () => {
    setSelected((prev) => {
      const copy = new Set(prev);
      if (copy.has(candidateId)) copy.delete(candidateId);
      else copy.add(candidateId);
      return copy;
    });
  };

  const handleSubmit = () => {
    if (selected.size === 0) {
      setAlertOpen(true);
      return;
    }
    const ids = Array.from(selected);
    onNext({ chunk: data.chunk, answer: ids });
  };

  const handleCantRank = () => {
    onNext({ chunk: data.chunk, answer: "CANT_RANK" });
  };

  return (
    <>
      <EmphCard>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Select the most impactful papers for{" "}
          <Link href={paperLink} target="_blank" rel="noopener noreferrer" underline="hover" sx={{ fontWeight: "bold" }}>
            {paperTitle}
          </Link>
          . You may select multiple.
        </Typography>
        <Divider variant="middle" />
        <Box sx={{ mt: 2 }}>
          <List>
            {data.candidates.map((c) => (
              <ListItem key={c.paperId} disablePadding>
                <FormControlLabel
                  control={<Checkbox checked={selected.has(c.paperId)} onChange={handleToggle(c.paperId)} />}
                  label={<ListItemText primary={c.title} secondary={c.reason} />}
                  sx={{ width: "100%" }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </EmphCard>

      <Box sx={{ textAlign: "center", width: "100%", mt: 2 }}>
        <Button variant="contained" onClick={handleSubmit} sx={{ m: 1 }}>
          Submit
        </Button>
        <Button variant="text" color="error" onClick={handleCantRank} sx={{ m: 1 }}>
          Can't Rank
        </Button>
      </Box>

      {alertOpen && (
        <Alert severity="warning" onClose={() => setAlertOpen(false)} sx={{ mt: 2 }}>
          Please select at least one paper before submitting.
        </Alert>
      )}
    </>
  );
}

export default SelectionForm;
