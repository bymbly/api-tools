#!/usr/bin/env node

import { lint } from "../../lib/spectral/lint.js";

process.exit(lint());
