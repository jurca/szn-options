'use strict'
;(global => {
  const SznElements = global.SznElements = global.SznElements || {}

  // TODO: when scrolling, scroll to the currently selected option on change
  SznElements['szn-options'] = class SznOptions {
    constructor(rootElement) {
      rootElement.setOptions = (options) => this.setOptions(options)

      this._root = rootElement
      this._options = null
    }

    onMount() {
    }

    onUnmount() {
    }

    setOptions(options) {
      this._options = options
      updateUi(this)
    }
  }

  function updateUi(instance) {
    if (!instance._options) {
      return
    }

    updateGroupUi(instance._root, instance._options)
  }

  function updateGroupUi(uiGroup, optionsGroup) {
    removeRemovedItems(uiGroup, optionsGroup)
    updateExistingItems(uiGroup, optionsGroup)
    addMissingItems(uiGroup, optionsGroup)
  }

  function removeRemovedItems(groupUi, options) {}

  function updateExistingItems(groupUi) {}

  /**
   * @param {HTMLElement} itemUi
   * @param {(HTMLOptionElement|HTMLOptGroupElement)} option
   */
  function updateItem(itemUi, option) {
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
        newItemUi.setAttribute('data-szn-options-' + (nextOption.tagName === "OPTGROUP" ? 'optgroup' : 'option'), '')
        updateItem(newItemUi, nextOption)
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
