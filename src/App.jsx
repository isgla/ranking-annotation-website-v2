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
      const seg = window.location.pathname.replace(/^\/+/, "").split("/")[0];
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

  const [items, setItems] = useState(() => {
    const initial = payload2;
    if (!initial) return {};
    const paperId = initial.paperId;
    return {
      [`${paperId}-bank`]: initial.candidates.map(
        (candidate) => `${paperId}-${candidate["paperId"]}`
      ),
      [`${paperId}-sorted`]: [],
    };
  });

  useEffect(() => {
    if (payload2) {
      const paperId = payload2.paperId;
      setItems({
        [`${paperId}-bank`]: payload2.candidates.map(
          (candidate) => `${paperId}-${candidate["paperId"]}`
        ),
        [`${paperId}-sorted`]: [],
      });
    }
  }, [payload2]);

  const handleNextPayload = async (paperId, answer) => {
    const entry = { paperId, chunk: null, answer };
    const newAnswers = [...answersT2, entry];
    setAnswersT2(newAnswers);

    const payloads = getPayloadsTask2();
    if (currentIndex + 1 < payloads.length) {
      const nextIndex = currentIndex + 1;
      const nextPayload = payloads[nextIndex];
      setCurrentIndex(nextIndex);
      setItems({
        [`${nextPayload.paperId}-bank`]: nextPayload.candidates.map(
          (candidate) => `${nextPayload.paperId}-${candidate["paperId"]}`
        ),
        [`${nextPayload.paperId}-sorted`]: [],
      });
    } else {
      setCurrentIndex(-1); // all done

      // POST Task2 answers to server
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
            Thank you for completing all ranking tasks. The answers have been
            saved on the server.
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ width: "100%" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Tabs value={value} onChange={(e, v) => setValue(v)}>
            <Tab label="Instructions" {...allyProps(0)} />
            <Tab label="TASK" {...allyProps(1)} />
          </Tabs>
          <Box sx={{ pr: 2 }}>
            <Typography variant="body2" sx={{ fontStyle: "italic" }}>
              User: <strong>{user ?? "(none)"}</strong>
              {user && !payloadMap[user] ? " — no payloads found for this user" : ""}
            </Typography>
          </Box>
        </Box>

        <CustomTabPanel value={value} index={0}>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Instructions
          </Typography>
          <Typography variant="body1">
            You'll receive a list of papers (r₁, r₂, r₃, …) that you cited in a
            paper P which you co-authored. Your task is to rank these papers by
            how impactful they were on your paper P.
          </Typography>
          <Box sx={{ mt: 2 }} />
          <Typography variant="body1">
            • Sort the papers for P. Drag to reorder, then submit.
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
