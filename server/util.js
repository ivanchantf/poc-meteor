import { Meteor } from 'meteor/meteor';

// import { Tasks } from '../imports/api/tasks';
import '../imports/api/tasksPublications';
import '../imports/api/methods';
import dotenv from 'dotenv';
import '../imports/api/offline';
import { Mongo, MongoInternals } from 'meteor/mongo';
import fs from 'fs';
import path from 'path';
import { inspect } from 'node:util';
/**
 * @param {any} data - The error object or data to log.
 * @param {string} contextText - Optional label to identify the log source.
 */
export const logToFileByDate = (data, contextText = '') => {
  const now = new Date();
  const dateFolder = now.toISOString().split('T')[0];
  const timestamp = now.toTimeString().split(' ')[0];

  // 1. Resolve Project Root
  let projectRoot = process.env.PWD || process.cwd();
  if (projectRoot.includes('.meteor')) {
    projectRoot = path.resolve(projectRoot.split('.meteor')[0]);
  }

  const dirPath = path.resolve(projectRoot, 'log', dateFolder);
  const filePath = path.join(dirPath, 'error.log');

  // 2. Prepare the Body
  let body = '';
  if (data instanceof Error) {
    body = data.stack || data.toString();
    if (data.cause) {
      body += `\n[CAUSE]: ${inspect(data.cause, { depth: 2, colors: false })}`;
    }
  } else {
    body = typeof data === 'object' ? inspect(data, { depth: null }) : String(data);
  }

  // 3. Construct the full entry with your custom text
  // We add the contextText prominently at the top if it exists
  const header = contextText ? ` >>> CONTEXT: ${contextText.toUpperCase()} <<<` : '';
  const logEntry = `[${timestamp}]${header}\n${body}\n${'='.repeat(60)}\n`;

  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.appendFileSync(filePath, logEntry, 'utf8');
  } catch (err) {
    console.error('Logging failed:', err);
  }
};

