import { Response, NextFunction } from 'express';

import Project from '@/models/Project';
import { logError } from '@/utils/logger';

export const createProject = async (req: any, res: Response, next: NextFunction) => {
  const FUNCTION_NAME = 'createProject';
  try {
    const { name, description } = req.body;

    const existing = await Project.findOne({ name, ownerId: req.user.id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Project with this name already exists' });
    }

    const project = new Project({
      name,
      description,
      ownerId: req.user.id
    });

    await project.save();
    return res.status(201).json({ success: true, data: project });
  } catch (error: any) {
    await logError(error, { source: 'API', functionName: FUNCTION_NAME, userId: req.user?.id, requestBody: req.body });
    return next(error);
  }
};

export const getProjects = async (req: any, res: Response, next: NextFunction) => {
  const FUNCTION_NAME = 'getProjects';
  try {
    const projects = await Project.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
    return res.json({ success: true, count: projects.length, data: projects });
  } catch (error: any) {
    await logError(error, { source: 'API', functionName: FUNCTION_NAME, userId: req.user?.id });
    return next(error);
  }
};

export const getProjectById = async (req: any, res: Response, next: NextFunction) => {
  const FUNCTION_NAME = 'getProjectById';
  try {
    const project = await Project.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    return res.json({ success: true, data: project });
  } catch (error: any) {
    await logError(error, { source: 'API', functionName: FUNCTION_NAME, userId: req.user?.id, queryParams: req.params });
    return next(error);
  }
};

export const updateProject = async (req: any, res: Response, next: NextFunction) => {
  const FUNCTION_NAME = 'updateProject';
  try {
    const { name, description, status } = req.body;
    const project = await Project.findOne({ _id: req.params.id, ownerId: req.user.id });

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;

    await project.save();
    return res.json({ success: true, data: project });
  } catch (error: any) {
    await logError(error, { source: 'API', functionName: FUNCTION_NAME, userId: req.user?.id, requestBody: req.body, queryParams: req.params });
    return next(error);
  }
};

export const deleteProject = async (req: any, res: Response, next: NextFunction) => {
  const FUNCTION_NAME = 'deleteProject';
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    return res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error: any) {
    await logError(error, { source: 'API', functionName: FUNCTION_NAME, userId: req.user?.id, queryParams: req.params });
    return next(error);
  }
};
