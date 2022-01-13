import React, { Children, Component } from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import { checkPropsChange, extractEventHandlers } from "../../common/utils";
import SpiderifierElement from "./SpiderifierElement";
import { TwoPi } from "./constants";

class MapboxGlSpiderifier extends Component {
  constructor(props) {
    super(props);
    this.state = {
      spiderParams: this._generateSpiderParams(props),
    };
  }

  componentDidUpdate(prevProps) {
    this._updateSpiderParams(prevProps);
  }

  _generateCircleParams(props) {
    const count = this._getMarkersCount(props);
    const { circleFootSeparation } = props;
    let circumference = circleFootSeparation * (2 + count);
    let legLength = circumference / TwoPi; // = radius from circumference
    let angleStep = TwoPi / count;

    return _.times(count, (index) => {
      const angle = index * angleStep;
      return {
        ...this._getSpiderPosition(props, legLength, angle),
        index,
        transitionDelay: this._getTransitionDelay(props, index),
      };
    });
  }

  _generateSpiderParams(props = this.props) {
    const { circleSpiralSwitchover, animate, animationSpeed, showingLegs } =
      props;
    const count = this._getMarkersCount(props);
    if (!count) {
      return null;
    }

    const shouldRenderLeg = count > 1 || showingLegs;
    const markersProps =
      count >= circleSpiralSwitchover
        ? this._generateSpiralParams(props)
        : this._generateCircleParams(props);

    return markersProps.map((markerProp) => ({
      ...markerProp,
      animate,
      animationSpeed,
      shouldRenderLeg,
    }));
  }

  _generateSpiralParams(props) {
    const count = this._getMarkersCount(props);
    const { spiralFootSeparation, spiralLengthFactor, spiralLengthStart } =
      props;

    let angle = 0;
    let legLength = spiralLengthStart;
    return _.times(count, (index) => {
      angle = angle + (spiralFootSeparation / legLength + index * 0.0005);
      legLength = legLength + (TwoPi * spiralLengthFactor) / angle;
      return {
        ...this._getSpiderPosition(props, legLength, angle),
        index,
        transitionDelay: this._getTransitionDelay(props, index),
        style: {
          zIndex: count - index,
        },
      };
    });
  }

  _getNotNullChildren(props = this.props) {
    const { children } = props;
    return Children.toArray(children).filter((child) => child !== null);
  }

  _getMarkersCount(props) {
    const children = this._getNotNullChildren(props);
    return children.length;
  }

  _getSpiderifierMarkers() {
    const { spiderParams } = this.state;
    if (!spiderParams) {
      return null;
    }

    const { coordinates } = this.props;
    const eventHanders = extractEventHandlers(this.props);
    return this._getNotNullChildren().map((child, index) => {
      const params = spiderParams[index];
      const { legStyles } = child.props;
      if (params) {
        return (
          <SpiderifierElement
            key={index}
            coordinates={coordinates}
            legStyles={legStyles}
            {...params}
            {...eventHanders}
          >
            {child}
          </SpiderifierElement>
        );
      }

      return null;
    });
  }

  _getSpiderPosition(props, legLength, angle) {
    const { transformSpiderLeft, transformSpiderTop } = props;
    return {
      angle,
      legLength: legLength - transformSpiderLeft,
      x: legLength * Math.cos(angle) + transformSpiderLeft,
      y: legLength * Math.sin(angle) + transformSpiderTop,
    };
  }

  _getTransitionDelay(props, index) {
    const markersCount = this._getMarkersCount(props);
    const { animationSpeed } = props;
    return (animationSpeed / 1000 / markersCount) * index;
  }

  _updateSpiderParams(prevProps) {
    if (
      checkPropsChange(
        this.props,
        prevProps,
        [
          "children",
          "circleFootSeparation",
          "circleSpiralSwitchover",
          "spiralFootSeparation",
          "spiralLengthStart",
          "spiralLengthFactor",
          "transformSpiderLeft",
          "showingLegs",
        ],
        _.isEqual
      )
    ) {
      this.setState({
        spiderParams: this._generateSpiderParams(this.props),
      });
    }
  }

  render() {
    return this._getSpiderifierMarkers();
  }
}

MapboxGlSpiderifier.displayName = "MapboxGlSpiderifier";
MapboxGlSpiderifier.propTypes = {
  /**
   * (required): [number, number] Display the Spiderifier at the given position
   */
  coordinates: PropTypes.array.isRequired,

  /**
   * Show spiral instead of circle from this marker count upwards
   * 0 -> always spiral; Infinity -> always circle
   */
  circleSpiralSwitchover: PropTypes.number,

  /**
   * Related to circumference of circle
   */
  circleFootSeparation: PropTypes.number,

  /**
   * Related to size of spiral
   */
  spiralFootSeparation: PropTypes.number,

  /**
   * Related to size of spiral
   */
  spiralLengthStart: PropTypes.number,
  /**
   * Related to size of spiral
   */
  spiralLengthFactor: PropTypes.number,

  /**
   * To enable animate the spiral
   */
  animate: PropTypes.bool,

  /**
   * Animation speed in milliseconds
   */
  animationSpeed: PropTypes.number,

  /**
   * [Optional] The margin in left side of each spider
   */
  transformSpiderLeft: PropTypes.number,

  /**
   * [Optional] The margin in top of each spider
   */
  transformSpiderTop: PropTypes.number,

  /**
   * [Optional] Indicate if the legs should be shown even when the spiderifier only have one spider element
   */
  showingLegs: PropTypes.bool,

  /**
   * [Optional] The click event handler
   */
  onClick: PropTypes.func,

  /**
   * [Optional] The mouse down event handler
   */
  onMouseDown: PropTypes.func,

  /**
   * [Optional] The mouse enter event handler
   */
  onMouseEnter: PropTypes.func,

  /**
   * [Optional] The mouse leave event handler
   */
  onMouseLeave: PropTypes.func,

  /**
   * [Optional] The mouse move event handler
   */
  onMouseMove: PropTypes.func,

  /**
   * [Optional] The mouse out event handler
   */
  onMouseOut: PropTypes.func,

  /**
   * [Optional] The mouse over event handler
   */
  onMouseOver: PropTypes.func,

  /**
   * [Optional] The mouse up event handler
   */
  onMouseUp: PropTypes.func,
};

MapboxGlSpiderifier.defaultProps = {
  circleSpiralSwitchover: 9,
  circleFootSeparation: 90,
  spiralFootSeparation: 80,
  spiralLengthStart: 60,
  spiralLengthFactor: 5,
  animate: true,
  animationSpeed: 500,
  transformSpiderLeft: 0,
  transformSpiderTop: 0,
  showingLegs: false,
};

export default MapboxGlSpiderifier;
