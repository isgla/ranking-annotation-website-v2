// Updated App.jsx — minimal changes required
// No logic changes needed for phased behavior in SelectionForm

import "./App.css";
import { useState, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import SelectionForm from "./prototypes/SelectionForm";

function loadAllPayloads() {
  const map = {};
  try {
    const context = require.context("./payloads", false, /\.json$/);
    context.keys().forEach((key) => {
      const fileName = key.replace("./", "").toLowerCase();
      const module = context(key);
      const content = module && module.default ? module.default : module;
      const author = fileName.split("-")[0];
      const isTask2 = fileName.includes("task-2") || fileName.includes("task2");
      if (!map[author]) map[author] = { task2: [] };
      if (isTask2) {
        if (Array.isArray(content)) map[author].task2.push(...content);
        else map[author].task2.push(content);
      }
    });
  } catch (e) {
    console.warn("Could not load payloads via require.context:", e);
  }
  return map;
}

const theme = createTheme({
  typography: {
    tagging: { fontWeight: "bold" },
    question: { fontStyle: "italic", fontSize: 20 },
    tiny: { writingMode: "vertical-rl", textOrientation: "mixed" },
  },
});

function allyProps(index) {
  return {
    id: `single-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`single-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <div>{children}</div>
        </Box>
      )}
    </div>
  );
}

function App() {
  const [value, setValue] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersT2, setAnswersT2] = useState([]);
  const [user, setUser] = useState(() => {
    try {
      const seg = window.location.pathname.replace(/^\/+/g, "").split("/")[0];
      return seg ? seg.toLowerCase() : null;
    } catch {
      return null;
    }
  });

  const payloadMap = useMemo(() => loadAllPayloads(), []);

  useEffect(() => {
    if (!user) {
      const authors = Object.keys(payloadMap);
      if (authors.length > 0) setUser(authors[0]);
    } else if (Object.keys(payloadMap).length > 0 && !payloadMap[user]) {
      const authors = Object.keys(payloadMap);
      if (authors.length > 0) setUser(authors[0]);
    }
  }, [payloadMap, user]);

  const getPayloadsTask2 = () => (payloadMap[user] ? payloadMap[user].task2 : []);
  const payload2 =
    currentIndex >= 0 && currentIndex < getPayloadsTask2().length
      ? getPayloadsTask2()[currentIndex]
      : null;

  const handleNextPayload = async (paperId, answer) => {
    const entry = { paperId, chunk: null, answer };
    const newAnswers = [...answersT2, entry];
    setAnswersT2(newAnswers);

    const payloads = getPayloadsTask2();
    if (currentIndex + 1 < payloads.length) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
    } else {
      setCurrentIndex(-1);

      try {
        const response = await fetch("http://localhost:4000/api/saveResponses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ author: user, task: 2, data: newAnswers }),
        });
        const result = await response.json();
        console.log(result.message);
      } catch (err) {
        console.error("Failed to save Task 2 answers to server:", err);
      }
    }
  };

  if (currentIndex === -1 || !payload2) {
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            ✅ All tasks completed!
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Thank you for completing all ranking tasks. The answers have been saved.
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ width: "100%" }}>
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Tabs value={value} onChange={(e, v) => setValue(v)}>
            <Tab label="Instructions" {...allyProps(0)} />
            <Tab label="TASK" {...allyProps(1)} />
          </Tabs>
          <Box sx={{ pr: 2 }}>
            <Typography variant="body2" sx={{ fontStyle: "italic" }}>
              User: <strong>{user ?? "(none)"}</strong>
              {user && !payloadMap[user] ? " — no payloads found" : ""}
            </Typography>
          </Box>
        </Box>

        <CustomTabPanel value={value} index={0}>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Instructions
          </Typography>
          <Typography variant="body1">
            You will receive a list of papers (r₁, r₂, r₃, …) that you cited in a paper P you co-authored. 
            First, you will <strong>rank</strong> the papers based on their impact on P. 
            Once you have finished sorting, you will <strong>place the impact category separators</strong> (high, medium, low impact) in the list. 
            Papers positioned under a separator belong to that category, and their colors will reflect the category they are placed under.
            Here is the definition of each category:
          </Typography>
          <Box sx={{ mt: 2 }} />
          <Typography variant="body1">
            <strong>High-impact citations:</strong> These are the papers <strong>without which your own work would not have been possible.</strong> They supply essential conceptual, methodological, or operational ingredients.<br/>
            Useful criteria:<br/>
            • Conceptual or operational indispensability: The reference provides a <strong>unique</strong> conceptual insight, methodological innovation, dataset, or technique that is directly instrumental to your paper. Examples: a specific algorithm your method extends; a benchmark or dataset your study critically depends on; a theoretical formulation your contribution builds on.<br/>
            • Organic necessity: The reference is uniquely and genuinely required for a reader to understand how your paper works or how its core logic unfolds. Without this citation, the intellectual lineage of your method would be opaque or incomplete.<br/>
            • Typical quantity: 1–5 papers (or even 1).
          </Typography>
          <Typography variant="body1">
            <strong>Medium-impact citations:</strong> These are papers that helped you write your paper, but <strong>were not fundamentally irreplaceable.</strong> You could have used an alternative prior work or formulation, but you chose this one because it was particularly useful, clear, or canonical.<br/>
            Useful criteria:<br/>
            • Conceptual or operational contribution (non-unique): The reference conveys an idea, dataset, or model family that meaningfully helped your setup, but other comparable alternatives exist. Examples: selecting LLaMA‑1 vs LLaMA‑2; choosing one evaluation protocol among several similar ones; relying on one of several formulations of a known concept.<br/>
            • Organic helpfulness: The reference is genuinely helpful for understanding your paper, but not uniquely necessary. It situates your work clearly, but your contribution does not hinge on this specific citation.<br/>
            • Typical quantity: roughly 5–15 papers.
          </Typography>
          <Typography variant="body1">
            <strong>Low-impact citations:</strong> These citations provide <strong>background, context, or perfunctory acknowledgement</strong>, but the core contribution of your paper is not dependent on them in any strong way.<br/>
            Useful criteria:<br/>
            • Background or definitional citations: References used to define a task, introduce a general problem area, or acknowledge standard terminology. The same role could have been fulfilled by many other papers.<br/>
            • Perfunctory or field‑signaling citations: The reference mainly signals that prior work exists in the broad area. The citing paper does not substantively depend on the specific ideas of the cited work.<br/>
            • Typical quantity: the majority of citations.
          </Typography>
        </CustomTabPanel>

        <CustomTabPanel value={value} index={1}>
          <SelectionForm
            data={payload2}
            onNext={(answer) => handleNextPayload(payload2?.paperId, answer)}
          />
        </CustomTabPanel>
      </Box>
    </ThemeProvider>
  );
}

export default App;