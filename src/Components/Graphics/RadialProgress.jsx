require("./circle.less");
import React from 'react';
import render from 'react-dom';

export default class RadialProgress extends React.Component {
    render() {
        return (
        <div className={`radial-progress ${this.props.color}`} data-progress={this.props.percent}>
            <div className="circle">
                <div className="mask full">
                    <div className="fill"></div>
                </div>
                <div className="mask half">
                    <div className="fill"></div>
                    <div className="fill fix"></div>
                </div>
                <div className="shadow"></div>
            </div>
            <div className="inset">
                <div className="percentage">
                        {this.props.title || this.props.percent}
                </div>
            </div>
        </div>
        )
    }
}