/* eslint-disable */
import React from "react";
import { Spin, Typography } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import "animate.css"; // Import animate.css for animations
import "antd/dist/reset.css"; // Ensure Ant Design styles are included

const { Title } = Typography;

const Loader = () => {
  return (
    <div className="loader-container">
      <div className="animated-icon">
        <EnvironmentOutlined style={{ fontSize: "48px", color: "#1890ff" }} />
      </div>
      <Title
        level={3}
        className="loading-text animate__animated animate__fadeIn"
      >
        Finding Your Location...
      </Title>
    </div>
  );
};

export default Loader;
