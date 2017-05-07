import React from 'react';
import render from 'react-dom';

export default class RadialProgress extends React.Component {
    render() {
        return (
            <div key={`${Math.random()}`} className="progress heatmap pull-left" style={{width: `${this.props.percent}%`}}>
                <div className={`progress-bar progress-bar-${this.props.color || 'opaque'}`} role="progressbar" style={{width: "100%"}}>
                </div>
            </div>
        )
    }
}