import "./App.css";
import { useState, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import QuestionForm from "./prototypes/QuestionForm";
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
      if (!map[author]) map[author] = { task1: [], task2: [] };
      if (isTask2) {
        if (Array.isArray(content)) map[author].task2.push(...content);
        else map[author].task2.push(content);
      } else {
        if (Array.isArray(content)) map[author].task1.push(...content);
        else map[author].task1.push(content);
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
      aria-labelledby={`simple-tab-${index}`}
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
  const [answersT1, setAnswersT1] = useState([]);
  const [answersT2, setAnswersT2] = useState([]);
  const getUserFromPath = () => {
    try {
      const seg = window.location.pathname.replace(/^\/+/, "").split("/")[0];
      if (seg) return seg.toLowerCase();
    } catch (e) {}
    return null;
  };
  const [user, setUser] = useState(() => getUserFromPath());

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

  const getPayloads = () => (payloadMap[user] ? payloadMap[user].task1 : []);
  const getPayloadsTask2 = () => (payloadMap[user] ? payloadMap[user].task2 : []);

  const payload1 =
    currentIndex >= 0 && currentIndex < getPayloads().length
      ? getPayloads()[currentIndex]
      : null;

  const payload2 =
    currentIndex >= 0 && currentIndex < getPayloadsTask2().length
      ? getPayloadsTask2()[currentIndex]
      : null;

  const currentPayload = value === 2 ? payload2 : payload1;

  const [items, setItems] = useState(() => {
    const initial = payload1 || payload2;
    if (!initial) return {};
    const paperId = initial.paperId;
    return {
      [`${paperId}-bank`]: initial.candidates.map(
        (candidate) => `${paperId}-${candidate["paperId"]}`
      ),
      [`${paperId}-sorted`]: [],
    };
  });

  const handleChange = (event, newValue) => setValue(newValue);

  useEffect(() => {
    const payloads1 = getPayloads();
    const first = payloads1 && payloads1.length ? payloads1[0] : null;

    setCurrentIndex(0);
    setAnswersT1([]);
    setAnswersT2([]);
    if (first) {
      setItems({
        [`${first.paperId}-bank`]: first.candidates.map(
          (candidate) => `${first.paperId}-${candidate["paperId"]}`
        ),
        [`${first.paperId}-sorted`]: [],
      });
    } else {
      setItems({});
    }

    const onPop = () => {
      const newUser = getUserFromPath();
      if (newUser && newUser !== user) setUser(newUser);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [payloadMap, user]);

  // --- UPDATED: handleNextPayload with POST to server ---
  const handleNextPayload = async (paperId, answer) => {
    let entry;
    if (answer && typeof answer === "object" && !Array.isArray(answer) && ("answer" in answer || "chunk" in answer)) {
      entry = { paperId, chunk: answer.chunk ?? null, answer: answer.answer ?? null };
    } else {
      entry = { paperId, chunk: null, answer };
    }

    const activeTask = value === 2 ? 2 : 1;

    if (activeTask === 1) {
      const newAnswers = [...answersT1, entry];
      setAnswersT1(newAnswers);

      const payloads = getPayloads();
      if (currentIndex + 1 < payloads.length) {
        const next = currentIndex + 1;
        const nextPayload = payloads[next];
        const nextId = nextPayload.paperId;

        setCurrentIndex(next);
        setItems({
          [`${nextId}-bank`]: nextPayload.candidates.map((candidate) => `${nextId}-${candidate["paperId"]}`),
          [`${nextId}-sorted`]: [],
        });
      } else {
        // Finished Task 1
        const payloads2 = getPayloadsTask2();
        if (payloads2 && payloads2.length > 0) {
          setValue(2);
          setCurrentIndex(0);
          const first = payloads2[0];
          setItems({
            [`${first.paperId}-bank`]: first.candidates.map((candidate) => `${first.paperId}-${candidate["paperId"]}`),
            [`${first.paperId}-sorted`]: [],
          });
        }

        // POST Task1 answers to server
        try {
          const response = await fetch("http://localhost:4000/api/saveResponses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              author: user,
              task: 1,
              data: newAnswers,
            }),
          });
          const result = await response.json();
          console.log(result.message);
        } catch (err) {
          console.error("Failed to save Task 1 answers to server:", err);
        }
      }
    } else {
      const newAnswers = [...answersT2, entry];
      setAnswersT2(newAnswers);

      const payloads = getPayloadsTask2();
      if (currentIndex + 1 < payloads.length) {
        const next = currentIndex + 1;
        const nextPayload = payloads[next];
        const nextId = nextPayload.paperId;

        setCurrentIndex(next);
        setItems({
          [`${nextId}-bank`]: nextPayload.candidates.map((candidate) => `${nextId}-${candidate["paperId"]}`),
          [`${nextId}-sorted`]: [],
        });
      } else {
        setCurrentIndex(-1);

        // POST Task2 answers to server
        try {
          const response2 = await fetch("http://localhost:4000/api/saveResponses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              author: user,
              task: 2,
              data: newAnswers,
            }),
          });
          const result2 = await response2.json();
          console.log(result2.message);
        } catch (err) {
          console.error("Failed to save Task 2 answers to server:", err);
        }
      }
    }
  };

  if (currentIndex === -1 || !currentPayload) {
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

  const paperId = currentPayload.paperId;

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ width: "100%" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Tabs value={value} onChange={handleChange}>
            <Tab label="Instructions" {...allyProps(0)} />
            <Tab label={`Task 1`} {...allyProps(1)} />
            <Tab label={`Task 2`} {...allyProps(2)} />
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
            Context
          </Typography>
          <Typography variant="body1">
            You'll receive a list of papers (r₁, r₂, r₃, …) that you cited in a
            paper P which you co-authored. Your task is to rank these papers by
            how impactful they were on your paper P.
          </Typography>
          <Box sx={{ mt: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Instructions for Task 1
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
          <Box sx={{ mt: 2 }} />
          <Box sx={{ mt: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Instructions for Task 2
          </Typography>
          <Typography variant="body1">
            • Select the most impactful papers for your paper P.
          </Typography>
          <Box sx={{ mt: 2 }} />
          <Typography variant="h6">
            Please select your <strong>{`User`}</strong> on the top right corner, then 
            click on <strong>{`TASK 1`}</strong> to start.
          </Typography>
        </CustomTabPanel>

        <CustomTabPanel value={value} index={1}>
          <QuestionForm
            data={payload1}
            items={items}
            setItems={setItems}
            onNext={(answer) => handleNextPayload(payload1?.paperId, answer)}
          />
        </CustomTabPanel>

        <CustomTabPanel value={value} index={2}>
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
