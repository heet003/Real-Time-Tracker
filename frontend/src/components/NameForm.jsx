/* eslint-disable */
import React, { useState } from 'react';
import { Button, Input, Modal } from 'antd';

const NameForm = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(true);

  const handleOk = () => {
    if (name.trim()) {
      onSubmit(name);
      setIsModalVisible(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <Modal
      title="Enter Your Name"
      visible={isModalVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Submit"
      cancelButtonProps={{ style: { display: 'none' } }}
      centered
      className="flex items-center justify-center"
    >
      <div className="flex flex-col items-center space-y-4">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-72" 
        />
      </div>
    </Modal>
  );
};

export default NameForm;
