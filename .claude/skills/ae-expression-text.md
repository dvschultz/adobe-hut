---
name: ae-expression-text
description: "Text expressions for After Effects: dynamic text, counters, timers, typewriter effects, text styling, and character-by-character animations."
---

# AE Text Expressions

Expressions for dynamic text, counters, styling, and text animations.

## Source Text Basics

### Access Source Text

```javascript
// In Source Text property
text.sourceText

// Get current text value
text.sourceText.value
```

### Static Text

```javascript
"Hello World"
```

### Dynamic Text

```javascript
// Show current time as text
Math.floor(time)

// Combine text
"Time: " + Math.floor(time)
```

## Counters

### Basic Counter

```javascript
Math.floor(time)
```

### Counter with Speed

```javascript
// Count at specific rate
var speed = 10;  // counts per second
Math.floor(time * speed)
```

### Count Up to Value

```javascript
var target = 100;
var duration = 3;  // seconds
Math.floor(linear(time, 0, duration, 0, target))
```

### Count with Easing

```javascript
var target = 1000;
var duration = 2;
Math.floor(ease(time, 0, duration, 0, target))
```

### Countdown

```javascript
var start = 10;
var countFrom = 0;  // start time in seconds
Math.max(0, Math.ceil(start - (time - countFrom)))
```

## Number Formatting

### Leading Zeros

```javascript
// Always 3 digits
var num = Math.floor(time * 10);
("000" + num).slice(-3)
```

### Thousands Separator

```javascript
var num = Math.floor(time * 100);
num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
```

### Decimal Places

```javascript
var num = time * 10;
num.toFixed(2)  // 2 decimal places
```

### Percentage

```javascript
var pct = linear(time, 0, 5, 0, 100);
Math.floor(pct) + "%"
```

### Currency

```javascript
var amount = linear(time, 0, 3, 0, 1234.56);
"$" + amount.toFixed(2)
```

## Time Displays

### Minutes:Seconds

```javascript
var mins = Math.floor(time / 60);
var secs = Math.floor(time % 60);
(mins < 10 ? "0" : "") + mins + ":" + (secs < 10 ? "0" : "") + secs
```

### Hours:Minutes:Seconds

```javascript
var hrs = Math.floor(time / 3600);
var mins = Math.floor((time % 3600) / 60);
var secs = Math.floor(time % 60);
(hrs < 10 ? "0" : "") + hrs + ":" +
(mins < 10 ? "0" : "") + mins + ":" +
(secs < 10 ? "0" : "") + secs
```

### Timecode

```javascript
timeToCurrentFormat(time)
```

### Frame Number

```javascript
Math.floor(time * thisComp.frameRate)
```

## Typewriter Effects

### Basic Typewriter

```javascript
var fullText = "Hello World";
var charsPerSec = 10;
var numChars = Math.floor(time * charsPerSec);
fullText.substring(0, numChars)
```

### Typewriter with Delay

```javascript
var fullText = "Type this text...";
var charsPerSec = 8;
var startDelay = 1;  // seconds
var t = Math.max(0, time - startDelay);
var numChars = Math.floor(t * charsPerSec);
fullText.substring(0, numChars)
```

### Typewriter with Cursor

```javascript
var fullText = "Typing...";
var charsPerSec = 5;
var numChars = Math.floor(time * charsPerSec);
var visible = fullText.substring(0, numChars);
var cursor = (time % 1 < 0.5) ? "|" : "";
visible + cursor
```

### Reverse Typewriter (Delete)

```javascript
var fullText = "Deleting this text";
var charsPerSec = 10;
var startTime = 2;
var t = Math.max(0, time - startTime);
var remaining = fullText.length - Math.floor(t * charsPerSec);
fullText.substring(0, Math.max(0, remaining))
```

## Text from Layers/Effects

### From Slider Control

```javascript
var num = thisComp.layer("Control").effect("Counter")("Slider");
Math.floor(num)
```

### From Another Text Layer

```javascript
thisComp.layer("Other Text").text.sourceText
```

### From Dropdown

```javascript
var menu = thisComp.layer("Control").effect("Option")("Menu");
var options = ["Red", "Green", "Blue"];
options[menu - 1]  // Dropdown is 1-indexed
```

### From Marker

```javascript
var m = thisLayer.marker;
if (m.numKeys > 0) {
    var idx = m.nearestKey(time).index;
    if (m.key(idx).time > time) idx--;
    if (idx > 0) {
        m.key(idx).comment
    } else {
        ""
    }
} else {
    ""
}
```

## Random Text

### Random Number per Frame

```javascript
Math.floor(random(1000))
```

### Consistent Random Number

```javascript
seedRandom(1, true);
Math.floor(random(1000))
```

### Random Letters

```javascript
var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var len = 5;
var result = "";
for (var i = 0; i < len; i++) {
    seedRandom(i, true);
    result += chars[Math.floor(random(chars.length))];
}
result
```

### Flickering Random Text

```javascript
var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
var len = 8;
var result = "";
seedRandom(Math.floor(time * 10), false);
for (var i = 0; i < len; i++) {
    result += chars[Math.floor(random(chars.length))];
}
result
```

## Text Styling (AE 17.0+)

### Access Style Object

```javascript
text.sourceText.style
```

### Available Style Properties

```javascript
text.sourceText.style.fontSize
text.sourceText.style.font
text.sourceText.style.fillColor
text.sourceText.style.strokeColor
text.sourceText.style.strokeWidth
text.sourceText.style.tracking
text.sourceText.style.leading
text.sourceText.style.baselineShift
text.sourceText.style.applyFill
text.sourceText.style.applyStroke
```

### Animated Font Size

```javascript
// On Source Text
var baseSize = 72;
var pulse = Math.sin(time * 4) * 10;
text.sourceText.style.setFontSize(baseSize + pulse)
```

### Animated Color

```javascript
// Cycle through hues
var hsl = [time % 1, 1, 0.5, 1];
var rgb = hslToRgb(hsl);
text.sourceText.style.setFillColor(rgb)
```

### Set Multiple Styles

```javascript
var s = text.sourceText.style;
s.setFontSize(48)
 .setFillColor([1, 0, 0, 1])
 .setTracking(50)
 .setText("Styled Text")
```

## Text with Line Breaks

### Multi-Line Text

```javascript
"Line 1\rLine 2\rLine 3"
// Use \r for line breaks in expressions
```

### Dynamic Multi-Line

```javascript
var line1 = "Score: " + Math.floor(time * 10);
var line2 = "Level: " + Math.ceil(time / 10);
line1 + "\r" + line2
```

## Text Based on Time

### Day/Night Text

```javascript
var hour = (time % 24);
hour < 12 ? "Good Morning" : "Good Evening"
```

### Changing Text Over Time

```javascript
var texts = ["First", "Second", "Third", "Fourth"];
var interval = 2;  // seconds per text
var idx = Math.floor(time / interval) % texts.length;
texts[idx]
```

### Scheduled Text

```javascript
if (time < 2) {
    "Loading..."
} else if (time < 5) {
    "Processing..."
} else {
    "Complete!"
}
```

## Text Expressions for Animators

### Character Index (in Text Animator)

```javascript
// Selector Expression
textIndex  // Current character index
textTotal  // Total characters
selectorValue  // Current selector value
```

### Per-Character Offset

```javascript
// For text animator property
textIndex * 10  // Stagger by index
```

### Random Per Character

```javascript
// In Selector Expression
seedRandom(textIndex, true);
100 * random()
```

## Practical Examples

### Score Counter

```javascript
var score = thisComp.layer("Control").effect("Score")("Slider");
"SCORE: " + ("00000" + Math.floor(score)).slice(-5)
```

### Countdown Timer

```javascript
var totalSeconds = 60;
var remaining = Math.max(0, totalSeconds - time);
var mins = Math.floor(remaining / 60);
var secs = Math.floor(remaining % 60);
(mins < 10 ? "0" : "") + mins + ":" + (secs < 10 ? "0" : "") + secs
```

### Word Counter

```javascript
var fullText = "This is a sentence that types out word by word";
var words = fullText.split(" ");
var wordsPerSec = 2;
var numWords = Math.min(Math.floor(time * wordsPerSec), words.length);
words.slice(0, numWords).join(" ")
```

### Path Length Display

```javascript
// Show distance traveled
var dist = length(position, position.valueAtTime(0));
"Distance: " + dist.toFixed(0) + " px"
```

### Layer Name Display

```javascript
thisLayer.name
```

### Comp Info

```javascript
thisComp.name + "\r" +
thisComp.width + " x " + thisComp.height + "\r" +
(thisComp.frameRate).toFixed(2) + " fps"
```

## Character-by-Character Animation Tips

For character-based animations, use Text Animators with expressions:

1. Add text animator (Animate > Position, Opacity, etc.)
2. Add Range Selector or Expression Selector
3. Use expressions in selector or animator properties

### Expression Selector

```javascript
// Wave effect based on character index
selectorValue * Math.sin(time * 4 + textIndex * 0.5)
```

### Staggered Reveal

```javascript
// Reveal characters over time
var delay = textIndex * 0.05;
linear(time, delay, delay + 0.2, 0, 100)
```

## Usage

When the user needs text expressions:

1. **Counters**: Numbers that count up/down
2. **Time Display**: Formatted time/timecode
3. **Typewriter**: Reveal text over time
4. **Dynamic Content**: Text from controls/layers
5. **Random Text**: Glitch/randomized characters
6. **Styling**: Animated text properties
7. **Character Animation**: Per-character effects

## Quick Reference

| Task | Expression Pattern |
|------|-------------------|
| Count up | `Math.floor(time * speed)` |
| Leading zeros | `("000" + num).slice(-3)` |
| MM:SS format | `mins + ":" + secs` |
| Typewriter | `text.substring(0, chars)` |
| Blinking cursor | `time % 1 < 0.5 ? "│" : ""` |
| Random char | `chars[Math.floor(random(len))]` |
| Line break | `"Line 1\rLine 2"` |
| From slider | `Math.floor(effect("Slider")("Slider"))` |
