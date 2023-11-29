import express from "express";
import type { Express, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";

const app: Express = express();
const PORT = 8000;

app.use(express.json());
app.use(cors());
const prisma = new PrismaClient();

const corsOptions = {
  origin: "https://main.dpffvq0483p7p.amplifyapp.com",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

//Todoデータの取得
app.get("/allTodos", async (req: Request, res: Response) => {
  const allTodos = await prisma.todo.findMany({
    where: {
      status: "todo",
    },
  });
  return res.json(allTodos);
});

//Todo作成
app.post("/createTodo", async (req: Request, res: Response) => {
  const { title, status } = req.body;
  const createTodo = await prisma.todo.create({
    data: {
      title,
      status,
    },
  });
  return res.json(createTodo);
});

//Todoタイトル変更
app.put("/editTodo/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, status } = req.body;
  const editTodo = await prisma.todo.update({
    where: { id },
    data: {
      title,
      status,
    },
  });
  return res.json(editTodo);
});

//Todo削除
app.delete("/deleteTodo/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const deleteTodo = await prisma.todo.delete({
    where: { id },
  });
  return res.json(deleteTodo);
});

//status: todo→reviewに変更
app.put("/checkedTodo/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const updatedTodo = await prisma.todo.update({
    where: { id },
    data: {
      status: "review",
      nextReviewDate: new Date(),
    },
  });
  return res.json(updatedTodo);
});

// Prismaを使用してreviewデータを取得
app.get("/allReviews", async (req: Request, res: Response) => {
  try {
    const currentDate = new Date();
    const allReviews = await prisma.todo.findMany({
      where: {
        status: "review",
        nextReviewDate: {
          lte: currentDate,
        },
      },
    });
    return res.status(200).json(allReviews);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
});

// reviewデータ忘却曲線
app.put("/reviewTime/:id", async (req: Request, res: Response) => {
  const reviewId = Number(req.params.id);
  const review = await prisma.todo.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    return res.status(404).json({ error: "Todo not found" });
  }

  // テスト用;
  // const intervals = [
  //   0.01 * 60 * 1000,
  //   0.02 * 60 * 1000,
  //   0.03 * 60 * 1000,
  //   0.04 * 60 * 1000,
  //   0.05 * 60 * 1000,
  //   0.06 * 60 * 1000,
  // ];

  const intervals = [
    // 60 * 60 * 1000, 1時間後
    24 * 60 * 60 * 1000, //1日後
    7 * 24 * 60 * 60 * 1000, //1週間後
    14 * 24 * 60 * 60 * 1000, //2週間後
    30 * 24 * 60 * 60 * 1000, //1ヶ月後
  ];

  let updatedReview;
  const reviewCount = review.reviewCount ?? 0;

  if (reviewCount < intervals.length) {
    updatedReview = await prisma.todo.update({
      where: { id: reviewId },
      data: {
        nextReviewDate: new Date(new Date().getTime() + intervals[reviewCount]),
        reviewCount: reviewCount + 1,
      },
    });
  } else {
    updatedReview = await prisma.todo.update({
      where: { id: reviewId },
      data: {
        status: "complete",
      },
    });
  }
  return res.json(updatedReview);
});

//reviewデータ削除
app.delete("/deleteReview/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const deleteReview = await prisma.todo.delete({
    where: { id },
  });
  return res.json(deleteReview);
});

app.listen(PORT, () => console.log("Server is running"));
