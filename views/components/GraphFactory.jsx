import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'

import Matrix from './Matrix.d3'

export default class GraphFactory extends Component {
  constructor(props) {
    super(props)
    this.graphs = {
      matrix: Matrix,
    }
  }
  componentDidMount() {
    if (!this.props.data || Object.keys(this.props.data).length == 0) {
      return
    }
    const el = findDOMNode(this)
    this.graph = new this.graphs[this.props.type](el, this.props)
    this.graph.create(this.props.data)
  }

  componentDidUpdate() {
    const el = findDOMNode(this)
    if (el.firstChild) {
      el.removeChild(el.firstChild)
    }
    if (!this.props.data || Object.keys(this.props.data).length == 0) {
      return
    }
    this.graph = new this.graphs[this.props.type](el, this.props)
    this.graph.create(this.props.data)
    //this.graph.update(this.props.data, this.props)
  }

  componentWillUnmount() {
  }

  render() {
    return (<div className="graph"></div>)
  }
}
