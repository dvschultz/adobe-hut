# External Libraries

This folder contains external libraries used by scripts in this repository.

## AEQuery

Scripts with `-aeq` suffix require the AEQuery library.

### Installation

**Option 1: Download from GitHub**
1. Go to https://github.com/docsforadobe/aequery/releases
2. Download `aequery.js` from the latest release
3. Place it in this `lib/` folder

**Option 2: npm**
```bash
npm install aequery
cp node_modules/aequery/dist/aequery.js lib/
```

### Usage

Scripts reference AEQuery via:
```javascript
#include '../lib/aequery.js'
```

### Documentation

- GitHub: https://github.com/docsforadobe/aequery
- Docs: https://aequery.docsforadobe.dev/
