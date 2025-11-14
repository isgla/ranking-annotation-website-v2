import MultipleContainerContext from "../components/DndContext";
import Alert from "@mui/material/Alert";
import { EmphCard } from "../components/Cards";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import Link from "@mui/material/Link";

function QuestionForm({ data, items, setItems, onNext }) {
  const [alertOpen, setAlertOpen] = useState(false);

  const paperId = data.paperId;
  const paperLink = data.paperLink;
  const paperTitle = data.paperTitle;

  // Reset state on new paper
  useEffect(() => {
    setAlertOpen(false);
  }, [paperId]);

  const handleSubmit = () => {
    if (items[`${paperId}-bank`]?.length !== 0) {
      setAlertOpen(true);
      return;
    }

    const ids = items[`${paperId}-sorted`]?.map((item) => item.slice(paperId.length + 1)) || [];

    // Send a normalized object: chunk at top-level, answer is ordered array of paperIds
    onNext({ chunk: data.chunk, answer: ids });
  };

  const handleCantRank = () => {
    onNext({ chunk: data.chunk, answer: "CANT_RANK" });
  };

  const handleKeepRanking = () => {
    const bankItems = items[`${paperId}-bank`] || [];
    setItems({
      [`${paperId}-bank`]: [],
      [`${paperId}-sorted`]: [
        ...(items[`${paperId}-sorted`] || []),
        ...bankItems,
      ],
    });

    // Automatically move to next paper with current sorted order
    // But signal that the user kept the ranking as-is rather than sending the explicit ordering
    onNext({ chunk: data.chunk, answer: "KEPT_AS_IS" });
  };

  return (
    <>
      <EmphCard>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Rank the following papers by their influence on{" "}
          <Link
            href={paperLink}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{ fontWeight: "bold" }}
          >
            {paperTitle}
          </Link>
          .
        </Typography>
        <Typography variant="body1">
                    • Drag and drop the papers into the sorted basket in the correct
                    rank order. Once you are done sorting, click "Submit". <br />
                    • If you think they are already sorted in the right order, you can
                    click "Keep ranking as is" and it will automatically move to the
                    next paper. <br />
                    • If you think these papers are all equally impactful to paper P,
                    click on "Can't rank" and it will automatically move to the next
                    paper.
                  </Typography>
        <Divider variant="middle" />
        <br />
        <MultipleContainerContext
          contextId={paperId}
          data={data}
          items={items}
          setItems={setItems}
          setAlertOpen={setAlertOpen}
        />
      </EmphCard>

      <Box sx={{ textAlign: "center", width: "100%" }}>
        <Button variant="outlined" onClick={handleKeepRanking} sx={{ m: 1 }}>
          Keep Ranking As Is
        </Button>

        <Button variant="contained" onClick={handleSubmit} sx={{ m: 1 }}>
          Submit
        </Button>

        <Button
          variant="text"
          color="error"
          onClick={handleCantRank}
          sx={{ m: 1 }}
        >
          Can't Rank
        </Button>
      </Box>

      {alertOpen && (
        <Alert severity="error" onClose={() => setAlertOpen(false)}>
          Please sort all papers before submission.
        </Alert>
      )}
    </>
  );
}

export default QuestionForm;
