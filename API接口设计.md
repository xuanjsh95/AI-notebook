# AI记事本 API 接口设计文档

## 概述

本文档定义了AI记事本应用的完整API接口规范，采用RESTful架构风格，支持JSON格式数据交换。

### 基础信息

- **Base URL**: `https://api.ai-notebook.com/v1`
- **协议**: HTTPS
- **数据格式**: JSON
- **字符编码**: UTF-8
- **API版本**: v1

### 认证方式

使用JWT (JSON Web Token) 进行身份认证：

```http
Authorization: Bearer <access_token>
```

### 通用响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### HTTP状态码

- `200` - 请求成功
- `201` - 创建成功
- `204` - 删除成功
- `400` - 请求参数错误
- `401` - 未授权
- `403` - 禁止访问
- `404` - 资源不存在
- `409` - 资源冲突
- `422` - 数据验证失败
- `429` - 请求频率限制
- `500` - 服务器内部错误

---

## 1. 用户认证模块

### 1.1 用户注册

**POST** `/auth/register`

#### 请求参数
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "firstName": "张",
  "lastName": "三",
  "language": "zh-CN",
  "timezone": "Asia/Shanghai"
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "firstName": "张",
      "lastName": "三",
      "emailVerified": false,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "expiresIn": 3600
    }
  }
}
```

### 1.2 用户登录

**POST** `/auth/login`

#### 请求参数
```json
{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": true
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "role": "user",
      "subscriptionPlan": "free",
      "lastLoginAt": "2024-01-01T00:00:00Z"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "expiresIn": 3600
    }
  }
}
```

### 1.3 刷新令牌

**POST** `/auth/refresh`

#### 请求参数
```json
{
  "refreshToken": "refresh_token"
}
```

### 1.4 用户登出

**POST** `/auth/logout`

#### 请求头
```http
Authorization: Bearer <access_token>
```

### 1.5 邮箱验证

**POST** `/auth/verify-email`

#### 请求参数
```json
{
  "token": "verification_token"
}
```

### 1.6 重发验证邮件

**POST** `/auth/resend-verification`

#### 请求参数
```json
{
  "email": "user@example.com"
}
```

### 1.7 忘记密码

**POST** `/auth/forgot-password`

#### 请求参数
```json
{
  "email": "user@example.com"
}
```

### 1.8 重置密码

**POST** `/auth/reset-password`

#### 请求参数
```json
{
  "token": "reset_token",
  "newPassword": "new_password123"
}
```

---

## 2. 用户管理模块

### 2.1 获取当前用户信息

**GET** `/users/me`

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "firstName": "张",
    "lastName": "三",
    "avatarUrl": "https://example.com/avatar.jpg",
    "bio": "个人简介",
    "role": "user",
    "subscriptionPlan": "free",
    "emailVerified": true,
    "settings": {
      "theme": "light",
      "language": "zh-CN",
      "timezone": "Asia/Shanghai"
    },
    "stats": {
      "notesCount": 25,
      "storageUsed": 1048576,
      "storageLimit": 1073741824
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "lastActivityAt": "2024-01-01T12:00:00Z"
  }
}
```

### 2.2 更新用户信息

**PUT** `/users/me`

#### 请求参数
```json
{
  "firstName": "张",
  "lastName": "三",
  "bio": "更新的个人简介",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

### 2.3 更新用户设置

**PUT** `/users/me/settings`

#### 请求参数
```json
{
  "theme": "dark",
  "language": "en-US",
  "timezone": "America/New_York",
  "notifications": {
    "email": true,
    "push": false
  }
}
```

### 2.4 修改密码

**PUT** `/users/me/password`

#### 请求参数
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password123"
}
```

### 2.5 删除账户

**DELETE** `/users/me`

#### 请求参数
```json
{
  "password": "current_password",
  "confirmation": "DELETE"
}
```

---

## 3. 笔记本管理模块

### 3.1 获取笔记本列表

**GET** `/notebooks`

#### 查询参数
- `page`: 页码（默认: 1）
- `limit`: 每页数量（默认: 20）
- `sort`: 排序方式（`created_at`, `updated_at`, `title`, `notes_count`）
- `order`: 排序顺序（`asc`, `desc`）

#### 响应示例
```json
{
  "success": true,
  "data": {
    "notebooks": [
      {
        "id": "uuid",
        "title": "工作笔记",
        "description": "记录工作相关内容",
        "color": "#1890ff",
        "icon": "work",
        "notesCount": 15,
        "isDefault": false,
        "isShared": false,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### 3.2 创建笔记本

**POST** `/notebooks`

#### 请求参数
```json
{
  "title": "新笔记本",
  "description": "笔记本描述",
  "color": "#52c41a",
  "icon": "book"
}
```

### 3.3 获取笔记本详情

**GET** `/notebooks/{id}`

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "工作笔记",
    "description": "记录工作相关内容",
    "color": "#1890ff",
    "icon": "work",
    "notesCount": 15,
    "isDefault": false,
    "isShared": false,
    "settings": {
      "autoSave": true,
      "defaultTemplate": "basic"
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

### 3.4 更新笔记本

**PUT** `/notebooks/{id}`

#### 请求参数
```json
{
  "title": "更新的标题",
  "description": "更新的描述",
  "color": "#f5222d",
  "icon": "folder"
}
```

### 3.5 删除笔记本

**DELETE** `/notebooks/{id}`

#### 查询参数
- `moveNotesTo`: 将笔记移动到指定笔记本ID（可选）

---

## 4. 笔记管理模块

### 4.1 获取笔记列表

**GET** `/notes`

#### 查询参数
- `page`: 页码（默认: 1）
- `limit`: 每页数量（默认: 20）
- `notebookId`: 笔记本ID
- `status`: 状态筛选（`draft`, `published`, `archived`）
- `tags`: 标签筛选（逗号分隔）
- `search`: 搜索关键词
- `sort`: 排序方式（`created_at`, `updated_at`, `title`）
- `order`: 排序顺序（`asc`, `desc`）
- `favorite`: 是否收藏（`true`, `false`）
- `pinned`: 是否置顶（`true`, `false`）

#### 响应示例
```json
{
  "success": true,
  "data": {
    "notes": [
      {
        "id": "uuid",
        "title": "会议记录",
        "excerpt": "今天的会议主要讨论了...",
        "tags": ["工作", "会议"],
        "status": "published",
        "isFavorite": false,
        "isPinned": true,
        "notebook": {
          "id": "uuid",
          "title": "工作笔记",
          "color": "#1890ff"
        },
        "metadata": {
          "wordCount": 1250,
          "readingTime": 5
        },
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### 4.2 创建笔记

**POST** `/notes`

#### 请求参数
```json
{
  "title": "新笔记",
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "这是笔记内容"
          }
        ]
      }
    ]
  },
  "notebookId": "uuid",
  "tags": ["标签1", "标签2"],
  "status": "draft"
}
```

### 4.3 获取笔记详情

**GET** `/notes/{id}`

#### 查询参数
- `includeVersions`: 是否包含版本历史（默认: false）

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "会议记录",
    "content": {
      "type": "doc",
      "content": [...]
    },
    "contentText": "纯文本内容用于搜索",
    "excerpt": "今天的会议主要讨论了...",
    "tags": ["工作", "会议"],
    "status": "published",
    "isFavorite": false,
    "isPinned": true,
    "isPublic": false,
    "shareToken": null,
    "version": 3,
    "notebook": {
      "id": "uuid",
      "title": "工作笔记",
      "color": "#1890ff"
    },
    "metadata": {
      "wordCount": 1250,
      "readingTime": 5,
      "lastEditedBy": "uuid"
    },
    "attachments": [
      {
        "id": "uuid",
        "filename": "image.jpg",
        "fileUrl": "https://example.com/files/image.jpg",
        "fileType": "image",
        "fileSize": 102400
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

### 4.4 更新笔记

**PUT** `/notes/{id}`

#### 请求参数
```json
{
  "title": "更新的标题",
  "content": {
    "type": "doc",
    "content": [...]
  },
  "tags": ["更新的标签"],
  "status": "published"
}
```

### 4.5 删除笔记

**DELETE** `/notes/{id}`

#### 查询参数
- `permanent`: 是否永久删除（默认: false，软删除）

### 4.6 批量操作笔记

**POST** `/notes/batch`

#### 请求参数
```json
{
  "action": "move", // move, delete, archive, favorite, unfavorite
  "noteIds": ["uuid1", "uuid2"],
  "targetNotebookId": "uuid" // 仅移动操作需要
}
```

### 4.7 收藏/取消收藏笔记

**POST** `/notes/{id}/favorite`
**DELETE** `/notes/{id}/favorite`

### 4.8 置顶/取消置顶笔记

**POST** `/notes/{id}/pin`
**DELETE** `/notes/{id}/pin`

### 4.9 获取笔记版本历史

**GET** `/notes/{id}/versions`

#### 响应示例
```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "id": "uuid",
        "versionNumber": 3,
        "title": "会议记录",
        "changeSummary": "添加了行动项",
        "createdBy": {
          "id": "uuid",
          "username": "user1"
        },
        "createdAt": "2024-01-01T12:00:00Z"
      }
    ]
  }
}
```

### 4.10 恢复笔记版本

**POST** `/notes/{id}/versions/{versionId}/restore`

---

## 5. 标签管理模块

### 5.1 获取标签列表

**GET** `/tags`

#### 查询参数
- `search`: 搜索关键词
- `sort`: 排序方式（`name`, `usage_count`, `created_at`）
- `order`: 排序顺序（`asc`, `desc`）

#### 响应示例
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "id": "uuid",
        "name": "工作",
        "color": "#87d068",
        "description": "工作相关内容",
        "usageCount": 25,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### 5.2 创建标签

**POST** `/tags`

#### 请求参数
```json
{
  "name": "新标签",
  "color": "#f50",
  "description": "标签描述"
}
```

### 5.3 更新标签

**PUT** `/tags/{id}`

#### 请求参数
```json
{
  "name": "更新的标签",
  "color": "#2db7f5",
  "description": "更新的描述"
}
```

### 5.4 删除标签

**DELETE** `/tags/{id}`

### 5.5 获取标签统计

**GET** `/tags/stats`

#### 响应示例
```json
{
  "success": true,
  "data": {
    "totalTags": 15,
    "mostUsedTags": [
      {
        "name": "工作",
        "usageCount": 25
      }
    ],
    "recentTags": [
      {
        "name": "新标签",
        "createdAt": "2024-01-01T12:00:00Z"
      }
    ]
  }
}
```

---

## 6. 文件上传模块

### 6.1 上传文件

**POST** `/upload`

#### 请求格式
- Content-Type: `multipart/form-data`
- 字段: `file`

#### 查询参数
- `noteId`: 关联的笔记ID（可选）

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "generated_filename.jpg",
    "originalFilename": "original.jpg",
    "fileUrl": "https://cdn.example.com/files/generated_filename.jpg",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 102400,
    "metadata": {
      "width": 1920,
      "height": 1080
    },
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

### 6.2 获取文件列表

**GET** `/attachments`

#### 查询参数
- `noteId`: 笔记ID
- `fileType`: 文件类型筛选
- `page`: 页码
- `limit`: 每页数量

### 6.3 删除文件

**DELETE** `/attachments/{id}`

---

## 7. 搜索模块

### 7.1 全文搜索

**GET** `/search`

#### 查询参数
- `q`: 搜索关键词（必需）
- `type`: 搜索类型（`notes`, `notebooks`, `tags`, `all`）
- `notebookId`: 限制搜索范围
- `tags`: 标签筛选
- `dateFrom`: 开始日期
- `dateTo`: 结束日期
- `page`: 页码
- `limit`: 每页数量

#### 响应示例
```json
{
  "success": true,
  "data": {
    "results": {
      "notes": [
        {
          "id": "uuid",
          "title": "会议记录",
          "excerpt": "...高亮的搜索结果...",
          "highlights": [
            "这是<mark>搜索关键词</mark>的高亮显示"
          ],
          "score": 0.95,
          "notebook": {
            "id": "uuid",
            "title": "工作笔记"
          }
        }
      ],
      "notebooks": [],
      "tags": []
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5
    },
    "searchTime": 0.05
  }
}
```

### 7.2 搜索建议

**GET** `/search/suggestions`

#### 查询参数
- `q`: 搜索关键词
- `limit`: 建议数量（默认: 10）

#### 响应示例
```json
{
  "success": true,
  "data": {
    "suggestions": [
      "会议记录",
      "会议纪要",
      "会议总结"
    ]
  }
}
```

---

## 8. AI功能模块

### 8.1 AI文本补全

**POST** `/ai/completion`

#### 请求参数
```json
{
  "prompt": "请帮我完成这段文字：今天的会议主要讨论了",
  "noteId": "uuid",
  "maxTokens": 150,
  "temperature": 0.7
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "completion": "项目进度、预算分配和下一阶段的工作计划。",
    "tokensUsed": 25,
    "cost": 0.001,
    "processingTime": 1200
  }
}
```

### 8.2 AI内容分析

**POST** `/ai/analyze`

#### 请求参数
```json
{
  "content": "要分析的文本内容",
  "analysisType": "summary", // summary, keywords, sentiment, structure
  "noteId": "uuid"
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "analysis": {
      "summary": "文档摘要",
      "keywords": ["关键词1", "关键词2"],
      "sentiment": "positive",
      "structure": {
        "headings": ["标题1", "标题2"],
        "sections": 3
      }
    },
    "tokensUsed": 50,
    "cost": 0.002
  }
}
```

### 8.3 AI标签建议

**POST** `/ai/suggest-tags`

#### 请求参数
```json
{
  "content": "笔记内容",
  "noteId": "uuid",
  "maxTags": 5
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "tag": "工作",
        "confidence": 0.95
      },
      {
        "tag": "会议",
        "confidence": 0.87
      }
    ]
  }
}
```

### 8.4 AI翻译

**POST** `/ai/translate`

#### 请求参数
```json
{
  "text": "要翻译的文本",
  "targetLanguage": "en",
  "sourceLanguage": "zh", // 可选，自动检测
  "noteId": "uuid"
}
```

### 8.5 获取AI使用统计

**GET** `/ai/usage`

#### 查询参数
- `period`: 统计周期（`day`, `week`, `month`）

#### 响应示例
```json
{
  "success": true,
  "data": {
    "usage": {
      "totalRequests": 150,
      "totalTokens": 5000,
      "totalCost": 0.25,
      "dailyLimit": 1000,
      "remainingQuota": 850
    },
    "breakdown": {
      "completion": 80,
      "analysis": 45,
      "translation": 25
    }
  }
}
```

---

## 9. 分享和协作模块

### 9.1 分享笔记

**POST** `/notes/{id}/share`

#### 请求参数
```json
{
  "isPublic": true,
  "password": "optional_password",
  "expiresAt": "2024-12-31T23:59:59Z",
  "allowComments": true
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "shareToken": "abc123def456",
    "shareUrl": "https://ai-notebook.com/shared/abc123def456",
    "isPublic": true,
    "expiresAt": "2024-12-31T23:59:59Z"
  }
}
```

### 9.2 取消分享

**DELETE** `/notes/{id}/share`

### 9.3 邀请协作者

**POST** `/notes/{id}/collaborators`

#### 请求参数
```json
{
  "email": "collaborator@example.com",
  "permission": "edit" // read, comment, edit
}
```

### 9.4 获取协作者列表

**GET** `/notes/{id}/collaborators`

### 9.5 更新协作者权限

**PUT** `/notes/{id}/collaborators/{userId}`

#### 请求参数
```json
{
  "permission": "comment"
}
```

### 9.6 移除协作者

**DELETE** `/notes/{id}/collaborators/{userId}`

---

## 10. 评论模块

### 10.1 获取评论列表

**GET** `/notes/{id}/comments`

#### 查询参数
- `page`: 页码
- `limit`: 每页数量
- `sort`: 排序方式（`created_at`, `updated_at`）

#### 响应示例
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "uuid",
        "content": "这是一条评论",
        "position": {
          "line": 5,
          "column": 10
        },
        "author": {
          "id": "uuid",
          "username": "user1",
          "avatarUrl": "https://example.com/avatar.jpg"
        },
        "replies": [
          {
            "id": "uuid",
            "content": "回复内容",
            "author": {
              "id": "uuid",
              "username": "user2"
            },
            "createdAt": "2024-01-01T12:30:00Z"
          }
        ],
        "isResolved": false,
        "createdAt": "2024-01-01T12:00:00Z",
        "updatedAt": "2024-01-01T12:00:00Z"
      }
    ]
  }
}
```

### 10.2 添加评论

**POST** `/notes/{id}/comments`

#### 请求参数
```json
{
  "content": "这是一条新评论",
  "position": {
    "line": 5,
    "column": 10
  },
  "parentId": "uuid" // 可选，用于回复
}
```

### 10.3 更新评论

**PUT** `/comments/{id}`

#### 请求参数
```json
{
  "content": "更新的评论内容"
}
```

### 10.4 删除评论

**DELETE** `/comments/{id}`

### 10.5 标记评论为已解决

**POST** `/comments/{id}/resolve`

---

## 11. 通知模块

### 11.1 获取通知列表

**GET** `/notifications`

#### 查询参数
- `page`: 页码
- `limit`: 每页数量
- `unread`: 是否只显示未读（`true`, `false`）
- `type`: 通知类型筛选

#### 响应示例
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "comment",
        "title": "新评论",
        "message": "用户A在您的笔记中添加了评论",
        "resourceType": "note",
        "resourceId": "uuid",
        "isRead": false,
        "createdAt": "2024-01-01T12:00:00Z"
      }
    ],
    "unreadCount": 5
  }
}
```

### 11.2 标记通知为已读

**PUT** `/notifications/{id}/read`

### 11.3 批量标记为已读

**PUT** `/notifications/read-all`

### 11.4 删除通知

**DELETE** `/notifications/{id}`

---

## 12. 统计和分析模块

### 12.1 获取用户统计

**GET** `/stats/user`

#### 查询参数
- `period`: 统计周期（`week`, `month`, `year`）

#### 响应示例
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalNotes": 125,
      "totalNotebooks": 8,
      "totalTags": 25,
      "storageUsed": 52428800,
      "storageLimit": 1073741824
    },
    "activity": {
      "notesCreated": [
        {
          "date": "2024-01-01",
          "count": 3
        }
      ],
      "notesUpdated": [
        {
          "date": "2024-01-01",
          "count": 5
        }
      ]
    },
    "topTags": [
      {
        "name": "工作",
        "count": 45
      }
    ],
    "productivity": {
      "averageNotesPerDay": 2.5,
      "longestStreak": 15,
      "currentStreak": 7
    }
  }
}
```

### 12.2 获取笔记统计

**GET** `/stats/notes`

#### 查询参数
- `notebookId`: 笔记本ID（可选）
- `period`: 统计周期

---

## 13. 系统管理模块（管理员）

### 13.1 获取系统统计

**GET** `/admin/stats`

#### 权限要求
- 需要管理员权限

#### 响应示例
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1250,
      "active": 980,
      "newThisMonth": 125
    },
    "content": {
      "totalNotes": 15000,
      "totalNotebooks": 3500,
      "totalAttachments": 8500
    },
    "storage": {
      "totalUsed": 5368709120,
      "averagePerUser": 4294967
    },
    "ai": {
      "totalRequests": 50000,
      "totalCost": 125.50
    }
  }
}
```

### 13.2 获取用户列表

**GET** `/admin/users`

#### 查询参数
- `page`: 页码
- `limit`: 每页数量
- `search`: 搜索关键词
- `role`: 角色筛选
- `status`: 状态筛选

### 13.3 更新用户状态

**PUT** `/admin/users/{id}/status`

#### 请求参数
```json
{
  "isActive": false,
  "reason": "违规操作"
}
```

---

## 错误代码说明

### 认证相关错误
- `AUTH_001`: 无效的认证令牌
- `AUTH_002`: 令牌已过期
- `AUTH_003`: 用户名或密码错误
- `AUTH_004`: 账户已被禁用
- `AUTH_005`: 邮箱未验证

### 权限相关错误
- `PERM_001`: 权限不足
- `PERM_002`: 资源访问被拒绝
- `PERM_003`: 操作不被允许

### 资源相关错误
- `RES_001`: 资源不存在
- `RES_002`: 资源已存在
- `RES_003`: 资源状态冲突

### 验证相关错误
- `VAL_001`: 请求参数无效
- `VAL_002`: 数据格式错误
- `VAL_003`: 必需字段缺失

### 业务逻辑错误
- `BIZ_001`: 存储空间不足
- `BIZ_002`: 文件大小超限
- `BIZ_003`: AI配额已用完
- `BIZ_004`: 操作频率过高

### 系统错误
- `SYS_001`: 服务器内部错误
- `SYS_002`: 数据库连接失败
- `SYS_003`: 外部服务不可用

---

## 请求频率限制

### 限制规则

- **普通API**: 每分钟100次请求
- **搜索API**: 每分钟30次请求
- **AI API**: 每分钟10次请求
- **上传API**: 每分钟20次请求

### 响应头

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### 超限响应

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "请求频率超限，请稍后重试",
    "details": {
      "retryAfter": 60
    }
  }
}
```

---

## 版本控制

### API版本策略

- 使用URL路径版本控制：`/v1/`, `/v2/`
- 向后兼容性保证：旧版本至少支持12个月
- 重大变更提前3个月通知

### 版本信息

**GET** `/version`

```json
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "apiVersion": "v1",
    "buildTime": "2024-01-01T00:00:00Z",
    "supportedVersions": ["v1"]
  }
}
```

---

## 开发环境配置

### 测试环境
- **Base URL**: `https://api-dev.ai-notebook.com/v1`
- **认证**: 使用测试令牌
- **限制**: 更宽松的频率限制

### 沙盒环境
- **Base URL**: `https://api-sandbox.ai-notebook.com/v1`
- **数据**: 模拟数据，定期重置
- **AI功能**: 使用模拟响应

### 本地开发
- **Base URL**: `http://localhost:3000/api/v1`
- **数据库**: 本地PostgreSQL
- **文件存储**: 本地文件系统

---

## SDK和工具

### 官方SDK
- JavaScript/TypeScript SDK
- Python SDK
- Go SDK

### 开发工具
- Postman Collection
- OpenAPI 3.0 规范文件
- 接口测试工具

### 示例代码

```javascript
// JavaScript SDK 示例
import { AINotebookAPI } from '@ai-notebook/sdk';

const api = new AINotebookAPI({
  baseURL: 'https://api.ai-notebook.com/v1',
  apiKey: 'your-api-key'
});

// 创建笔记
const note = await api.notes.create({
  title: '新笔记',
  content: { type: 'doc', content: [...] },
  notebookId: 'notebook-id'
});

// 搜索笔记
const results = await api.search({
  q: '搜索关键词',
  type: 'notes'
});
```

---

本API文档将随着产品迭代持续更新，请关注版本变更通知。如有疑问，请联系技术支持团队。