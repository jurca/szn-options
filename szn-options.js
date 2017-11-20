'use strict'
;(global => {
  const SznElements = global.SznElements = global.SznElements || {}

  // TODO: when scrolling, scroll to the currently selected option on change
  SznElements['szn-options'] = class SznOptions {
    constructor(rootElement) {
      rootElement.setOptions = (options) => this.setOptions(options)
      rootElement.updateUi = () => updateUi(this)

      this._root = rootElement
      this._options = null
      this._dragSelectionStartOption = null
      this._mounted = false

      this._onItemHovered = event => onItemHovered(this, event.target)
      this._onItemClicked = event => onItemClicked(this, event.target)
      this._onItemSelectionStart = event => onItemSelectionStart(this, event.target)

      this._onSelectionEnd = () => {
        this._dragSelectionStartOption = null
      }

      this._onSelectionChange = () => {
        this._root.removeAttribute('data-szn-options-highlighting')
        updateUi(this)
      }
    }

    onMount() {
      this._mounted = true
      addEventListeners(this)
    }

    onUnmount() {
      removeEventListeners(this)
      this._root.removeAttribute('data-szn-options-highlighting')
      this._mounted = false
    }

    setOptions(options) {
      if (this._options) {
        removeEventListeners(this)
      }

      this._options = options
      addEventListeners(this)
      updateUi(this)
    }
  }

  function addEventListeners(instance) {
    if (!instance._mounted || !instance._options) {
      return
    }

    instance._options.addEventListener('change', instance._onSelectionChange)
    instance._root.addEventListener('mouseover', instance._onItemHovered)
    instance._root.addEventListener('mousedown', instance._onItemSelectionStart)
    instance._root.addEventListener('mouseup', instance._onItemClicked)
    addEventListener('mouseup', instance._onSelectionEnd)
  }

  function removeEventListeners(instance) {
    instance._options.removeEventListener('change', instance._onSelectionChange)
    instance._root.removeEventListener('mouseover', instance._onItemHovered)
    instance._root.removeEventListener('mousedown', instance._onItemSelectionStart)
    instance._root.removeEventListener('mouseup', instance._onItemClicked)
    removeEventListener('mouseup', instance._onSelectionEnd)
  }

  function onItemHovered(instance, itemUi) {
    if (!isEnabledOptionUi(itemUi)) {
      return
    }

    if (instance._options.multiple) {
      if (instance._dragSelectionStartOption) {
        updateMultiSelection(instance, event.target)
      }
      return
    }

    instance._root.setAttribute('data-szn-options-highlighting', '')
    const previouslyHighlighted = instance._root.querySelector('[data-szn-options-highlighted]')
    if (previouslyHighlighted) {
      previouslyHighlighted.removeAttribute('data-szn-options-highlighted')
    }
    itemUi.setAttribute('data-szn-options-highlighted', '')
  }

  function onItemClicked(instance, itemUi) {
    if (instance._dragSelectionStartOption) { // multi-select
      instance._dragSelectionStartOption = null
      return
    }

    if (!isEnabledOptionUi(itemUi)) {
      return
    }

    instance._root.removeAttribute('data-szn-options-highlighting')
    instance._options.selectedIndex = itemUi._option.index
    instance._options.dispatchEvent(new CustomEvent('change', {bubbles: true, cancelable: true}))
  }

  function onItemSelectionStart(instance, itemUi) {
    if (!instance._options.multiple || !isEnabledOptionUi(itemUi)) {
      return
    }

    instance._dragSelectionStartOption = itemUi._option
    updateMultiSelection(instance, itemUi)
  }

  function updateMultiSelection(instance, lastHoveredItem) {
    const startIndex = instance._dragSelectionStartOption.index
    const lastIndex = lastHoveredItem._option.index
    const minIndex = Math.min(startIndex, lastIndex)
    const maxIndex = Math.max(startIndex, lastIndex)
    const options = instance._options.options

    for (let i = 0, length = options.length; i < length; i++) {
      const option = options.item(i)
      if (isOptionEnabled(option)) {
        option.selected = i >= minIndex && i <= maxIndex
      }
    }

    instance._options.dispatchEvent(new CustomEvent('change', {bubbles: true, cancelable: true}))
  }

  function isEnabledOptionUi(optionUi) {
    return (
      optionUi.hasAttribute('data-szn-options-option') &&
      isOptionEnabled(optionUi._option)
    )
  }

  function isOptionEnabled(option) {
    return (
      !option.disabled &&
      !option.parentNode.disabled
    )
  }

  function updateUi(instance) {
    if (!instance._options) {
      return
    }

    updateGroupUi(instance._root, instance._options)
  }

  function updateGroupUi(uiGroup, optionsGroup) {
    removeRemovedItems(uiGroup, optionsGroup)
    updateExistingItems(uiGroup)
    addMissingItems(uiGroup, optionsGroup)
  }

  function removeRemovedItems(groupUi, options) {}

  function updateExistingItems(groupUi) {
    let itemUi = groupUi.firstElementChild
    while (itemUi) {
      updateItem(itemUi)
      itemUi = itemUi.nextElementSibling
    }
  }

  /**
   * @param {HTMLElement} itemUi
   */
  function updateItem(itemUi) {
    const option = itemUi._option
    if (option.disabled) {
      itemUi.setAttribute('disabled', '')
    } else {
      itemUi.removeAttribute('disabled')
    }

    if (option.tagName === "OPTGROUP") {
      updateGroupUi(itemUi, option)
      itemUi.setAttribute('data-szn-options-optgroup-label', option.label)
      return
    }

    itemUi.innerText = option.text
    if (option.title) {
      itemUi.setAttribute('title', option.title)
    } else {
      itemUi.removeAttribute('title')
    }

    if (option.selected) {
      itemUi.setAttribute('data-szn-options-selected', '')
    } else {
      itemUi.removeAttribute('data-szn-options-selected')
    }
  }

  function addMissingItems(groupUi, options) {
    let nextItemUi = groupUi.firstElementChild
    let nextOption = options.firstElementChild
    while (nextOption) {
      if (!nextItemUi || nextItemUi._option !== nextOption) {
        const newItemUi = document.createElement('szn-')
        newItemUi._option = nextOption
        newItemUi.setAttribute('data-szn-options-' + (nextOption.tagName === "OPTGROUP" ? 'optgroup' : 'option'), '')
        updateItem(newItemUi)
        groupUi.insertBefore(newItemUi, nextItemUi)
      } else {
        nextItemUi = nextItemUi && nextItemUi.nextElementSibling
      }

      nextOption = nextOption.nextElementSibling
    }
  }

  if (SznElements.init) {
    SznElements.init()
  }
})(self)
