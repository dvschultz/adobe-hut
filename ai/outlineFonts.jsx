﻿#target illustratorvar doc = app.activeDocument;app.executeMenuCommand('selectall'); app.executeMenuCommand('outline');doc.close(SaveOptions.SAVECHANGES);