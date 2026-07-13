import React from "react";
import { Tabs, Card, Typography } from "antd";
import SecurityTab from "../../components/SecurityTab";
import BasicInfoTab from "../../components/BasicInfoTab";

const { Title } = Typography;

export default function ProfilePage() {
  const items = [
    {
      key: "basic-info",
      label: "Thông tin cơ bản",
      children: <BasicInfoTab />,
    },
    {
      key: "security",
      label: "Bảo mật & Đăng nhập",
      children: <SecurityTab />,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-sm">
        <Title level={3} className="mb-6">Cài đặt tài khoản</Title>
        <Tabs defaultActiveKey="basic-info" items={items} size="large" />
      </Card>
    </div>
  );
}