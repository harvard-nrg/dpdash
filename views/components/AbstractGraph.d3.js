export default class AbstractGraph {
  constructor(el, props) {
    this.el = el;
    this.props = props;
  }
  unmount() {
    this.el.remove();
  }
  create() {

  }
  update() {

  }
}