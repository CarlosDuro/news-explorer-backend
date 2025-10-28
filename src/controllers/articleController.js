import Article from '../models/Article.js';
import { forbidden, notFound } from '../utils/httpErrors.js';

export async function listArticles(req, res, next) {
  try {
    const docs = await Article.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (e) {
    next(e);
  }
}

export async function createArticle(req, res, next) {
  try {
    const doc = await Article.create({ ...req.body, owner: req.user._id });
    res.status(201).json(doc);
  } catch (e) {
    next(e);
  }
}

export async function deleteArticle(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await Article.findById(id);
    if (!doc) throw notFound('Article not found');
    if (String(doc.owner) !== String(req.user._id)) throw forbidden('Not your article');
    await doc.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
