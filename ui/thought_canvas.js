'use_strict';

const CTDLGPT = window.CTDLGPT;

// handles inputs for thought creation
class ThoughtInput {
  constructor(input_element) {
    // create an html element for the main text input
    this.elem = document.createElement('textarea');

    // a place to put the callback function we call when a new thought is inputted
    this.onAdd = null;

    // key release handler
    this.elem.addEventListener('keyup', event => {
      // do nothing if the key code is not the enter key
      if (event.code != 'Enter') { return; }

      // create a new thought
      let thought = CTDLGPT.create_thought(this.elem.value);

      // call our callback, if it has been set
      if (this.onAdd) { this.onAdd(thought) };

      // clear the input
      this.elem.value = '';
    });
  }
}

// An object which contains everything used by our *representation* of a Thought
class ThoughtDisplay {
  constructor(thought) {
    console.log("new thoughtdisplay", thought);

    this.deleteHandler = null;

    // store the actual Thought in "this" so we can access it later
    this.thought = thought;

    // construct a div to represent the thought, give it a class so we can style
    // it with css, and also put our text inside of it
    this.elem = document.createElement("div");
    this.elem.classList.add("thought");
    this.elem.textContent = this.thought.text;

    // add a "closebutton" <div> and register a click event listener to remove
    // this thought on click. We don't need to access this later so don't bother
    // storing a reference to it in this
    let closebtn = document.createElement('button')
    closebtn.classList.add("closebutton")
    closebtn.textContent = 'X'
    closebtn.addEventListener('click', (ev) => {
      if (this.deleteHandler) {this.deleteHandler()};
    })
    // insert the "closebutton" div in the thought div
    this.elem.appendChild(closebtn)

    //checkmark button thing
    let checkbtn = document.createElement('button')
    checkbtn.classList.add("checkbutton")
    checkbtn.textContent = '✔'
    //checkbtn.addEventListener('click', (ev) => {
    // TC.sort_thought(this)
    // })

    this.elem.appendChild(checkbtn)

    // function for other code to call when they want to remove us 
    this.remove = () => {
      // for now all we do is remove this.elem from the document
      this.elem.remove()
    }
  }
}

// TODO: objectify sort boxes
// class ThoughtSorter {
//   constructor(element) {
//     this.elem = element;
//     // extract sorting from the html for now but like, don't do this
//     this.sorting = this.elem.parentElement.getAttribute('href').split('#')[1]
//   }
// }

class ThoughtCanvas {
  constructor(element) {
    this.elem = element;
    this.sorting_filter = 'inbox';

    // this.controls = ThoughtCanvasControls
    this.thought_input = new ThoughtInput();
    this.elem.appendChild(this.thought_input.elem)

    this.thought_input.onAdd = function(thought) {
      thought.sorting = this.sorting_filter;
      // TODO: use additional methods on ThoughtCanvas to put this in a more reasonable spot
      CTDLGPT.save();
      this.clap();
      this.add_thought(thought);
    }.bind(this);

    this.sort_boxes = [];
    for (let elem of document.getElementsByClassName('sort-box')) {
      // this.sort_boxes.push(new ThoughtSorter(elem));
      this.sort_boxes.push(elem);

      elem.addEventListener('click', (ev) => { this.set_sorting(ev.target.parentElement.getAttribute('href').split('#')[1]) });
    }

    this.displayed_thoughts = [];
    for (let thought of CTDLGPT.get_thoughts()) {
      this.add_thought(thought);
    };

  }

  // this function creates a new Thought instance and adds its element (elem)
  // to the thought canvas it also stores it in an array (this.thoughts) and
  // saves the json representation to a file using the preloaded
  // window.save_thoughts function (from preload.js)
  add_thought(thought) {
    let td = new ThoughtDisplay(thought)
    let drag = new DragSystem(td.elem);

    td.deleteHandler = () => {
      CTDLGPT.delete_thought(td.thought);
      CTDLGPT.save();
      td.remove();
    }

    drag.onDrop = function(ev) {
      console.log("dropp", this);
      // TODO hackish but not-as-hackish-as-last-time™ quick and dirty sorting function
      let dropped_on = document.elementFromPoint(ev.clientX, ev.clientY);
      if (dropped_on.classList.contains('sort-box')) {
	this.TD.thought.sorting = dropped_on.parentElement.getAttribute('href').split('#')[1]
	if (this.TC.sorting_filter != this.TD.thought.sorting) {
	  this.TD.remove();
	}
      }
    }.bind({TC: this, TD: td});

    this.elem.appendChild(td.elem);
    this.displayed_thoughts.push(td);
  }

  // removes the thoughtdisplay from canvas display
  remove_thought(thoughtdisplay) {
      // find the index of the thought we're supposed to remove
      // let idx = this.thoughts.indexOf(thought)
      // // indexOf returns -1 if the item we're looking for (thought) doesn't exist, so we don't remove anything in that case
      // if (idx != -1) { //
	//  // delete 1 element starting at idx
	//  this.thoughts.splice(idx, 1)
      // }
      // also tell the thought instance to remove its stuff
      thoughtdisplay.elem.remove();
  }

  clear_thoughts() {
    for (let td of this.displayed_thoughts) {
      td.elem.remove();
    }
  }

  // yay O(1) algorithms for no reason woo
  refresh() {
    this.clear_thoughts();
    for (let thought of CTDLGPT.get_thoughts()) {
      console.log(thought);
      if (thought.sorting == this.sorting_filter) {
	this.add_thought(thought);
      }
    }
  }

  set_sorting(sorting) {
    this.sorting_filter = sorting;
    document.getElementById('title').textContent = this.sorting_filter;

    this.refresh();
  }

  // :clap:
  clap() {
    var clapdiv = document.createElement('div');
    clapdiv.textContent = "👏";
    clapdiv.style.position = "fixed";
    clapdiv.style.display = "inline-block";
    clapdiv.style.fontSize = 90 + "px";

    // let canvas_bounds = this.canvas.getBoundingClientRect();
    clapdiv.style.left = 0 + "px";
    clapdiv.style.top = 50 + "px";
    document.body.appendChild(clapdiv);

    window.setTimeout(() => {
      clapdiv.remove();
      clapdiv.animate = "change";
    }, 2000);
  }

  // add thoughts for all the thoughts in a list
  // initialize_thoughtlist(thoughtlist) {
  //   for (thought of thoughtlist) {
  //     this.add_thought(thought.text, thought)
  //   }
  // }

  focus() {
    this.thought_input.elem.focus();
  }

  // load the list of thoughts from the file (window.load_thoughts is from preload.js)
  // window.load_thoughts(this.initialize_thoughtlist)

}
