"use client";
import React from "react";

/**
 * ProductDescription component for displaying product description text
 * @param {Object} props - Component props
 * @param {string} props.text - The description text to display
 * @param {string} [props.className] - Optional additional CSS class
 */
const ProductDescription = ({ text, className = "" }) => {
  return (
    <div
      className={`${className}`}
      style={{
        color: "#7A7A7A",
        fontSize: "20px",
        fontWeight: "400",
        marginTop: "25px",
        width: "auto",
        alignSelf: "stretch",
      }}
    >
      {text}
    </div>
  );
};

export default ProductDescription;
