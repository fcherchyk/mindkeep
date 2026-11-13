/** The English content, read from src/content/en and checked once at start-up. */

import games from "../content/en/games.json";
import items from "../content/en/items.json";
import oddLevels from "../content/en/odd_levels.json";
import prompts from "../content/en/prompts.json";
import shoppingLevels from "../content/en/shopping_levels.json";
import strings from "../content/en/strings.json";
import { type Content, parseContent } from "../core/content";

export const raw = { locale: "en", games, items, shoppingLevels, oddLevels, strings, prompts };

export const content: Content = parseContent(raw);
