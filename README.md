# szn-options

Accessible HTML selectbox options list with customizable UI. Based on web
components and easy to integrate with various frameworks like React or Angular.

This component is not meant to be used stand-alone, it is a helper component
meant to be used in other `szn-` components.

---

This project has been re-integrated into the
[szn-select](https://github.com/jurca/szn-select) element. This repository is
no longer up-to-date.

---

## Usage

Markup (usually created dynamically via JS):

```html
<script src="szn-options.es3.js"></script>
<!-- ...or, depending on the targeted browsers: -->
<script src="szn-options.es6.js"></script>
…
<szn-options></szn-options>
…
<select>
  <option …>…</option>
  <optgroup label="…">
    …
  </optgroup>
  …
</select>
```

JavaScript to wire things up:

```javascript
var select = document.getElementsByTagName('select')
var sznOptions = document.getElementsByTagName('szn-options')
sznOptions.setOptions(select)
```
