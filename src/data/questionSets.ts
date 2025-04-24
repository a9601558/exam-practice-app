import { Question } from './questions';

export interface QuestionSet {
  id: string;
  title: string;
  description: string;
  category: string;
  questions: Question[];
  icon: string; // 使用简单的图标名称，可以是emoji或图标类名
}

export const questionSets: QuestionSet[] = [
  {
    id: 'network',
    title: '网络协议',
    description: '测试你对TCP/IP、HTTP等网络协议的理解',
    category: '计算机基础',
    icon: '🌐',
    questions: [
      {
        id: 1,
        question: "在 TCP/IP 协议栈中，哪一层负责路由选择和数据转发？",
        options: [
          { id: "A", text: "物理层" },
          { id: "B", text: "数据链路层" },
          { id: "C", text: "网络层" },
          { id: "D", text: "传输层" }
        ],
        correctAnswer: "C",
        explanation: "网络层（Network Layer）负责在不同网络之间传输数据包，实现路由选择和数据转发功能。在 TCP/IP 协议栈中，IP 协议位于网络层，提供了确定源主机和目标主机之间路径的功能。"
      },
      {
        id: 2,
        question: "HTTP协议默认使用的端口号是？",
        options: [
          { id: "A", text: "21" },
          { id: "B", text: "80" },
          { id: "C", text: "443" },
          { id: "D", text: "8080" }
        ],
        correctAnswer: "B",
        explanation: "HTTP（超文本传输协议）默认使用80端口。HTTPS使用443端口，FTP使用21端口，而8080通常作为HTTP的替代端口。"
      }
    ]
  },
  {
    id: 'algorithms',
    title: '算法与数据结构',
    description: '测试你对基本算法和数据结构的掌握',
    category: '计算机基础',
    icon: '⚙️',
    questions: [
      {
        id: 1,
        question: "以下哪种排序算法的平均时间复杂度为 O(n log n)？",
        options: [
          { id: "A", text: "冒泡排序" },
          { id: "B", text: "插入排序" },
          { id: "C", text: "选择排序" },
          { id: "D", text: "快速排序" }
        ],
        correctAnswer: "D",
        explanation: "快速排序的平均时间复杂度为 O(n log n)，它采用分治策略，通过一个枢轴元素将数组分成两部分，然后递归地对两部分进行排序。冒泡排序、插入排序和选择排序的平均时间复杂度均为 O(n²)。"
      },
      {
        id: 2,
        question: "下列哪种数据结构最适合实现优先队列？",
        options: [
          { id: "A", text: "栈" },
          { id: "B", text: "链表" },
          { id: "C", text: "堆" },
          { id: "D", text: "二叉搜索树" }
        ],
        correctAnswer: "C",
        explanation: "堆（特别是最小堆或最大堆）是实现优先队列的最佳数据结构，它能够在O(log n)时间内执行插入和删除操作，同时在O(1)时间内获取最高优先级的元素。"
      }
    ]
  },
  {
    id: 'oop',
    title: '面向对象编程',
    description: '测试你对面向对象编程概念的理解',
    category: '编程范式',
    icon: '🧩',
    questions: [
      {
        id: 1,
        question: "在面向对象编程中，下列关于封装的说法哪一项是正确的？",
        options: [
          { id: "A", text: "封装是将数据和行为绑定在一起，对外部隐藏实现细节" },
          { id: "B", text: "封装主要用于实现多态性" },
          { id: "C", text: "封装是一个类继承另一个类的属性和方法的机制" },
          { id: "D", text: "封装使得不相关的类可以使用相同的接口" }
        ],
        correctAnswer: "A",
        explanation: "封装是面向对象编程的基本原则之一，它指的是将数据和操作数据的方法绑定在一起，对外部隐藏对象的内部实现细节，只暴露必要的接口。这样可以保护对象的内部状态，提高代码的安全性和可维护性。"
      },
      {
        id: 2,
        question: "以下哪个不是面向对象编程的核心概念？",
        options: [
          { id: "A", text: "封装" },
          { id: "B", text: "继承" },
          { id: "C", text: "多态" },
          { id: "D", text: "递归" }
        ],
        correctAnswer: "D",
        explanation: "面向对象编程的三大核心概念是封装、继承和多态。递归是一种编程技术，是指在函数定义中使用函数自身的方法，与面向对象编程的核心概念无关。"
      }
    ]
  },
  {
    id: 'database',
    title: '数据库原理',
    description: '测试你对SQL和数据库概念的理解',
    category: '数据管理',
    icon: '💾',
    questions: [
      {
        id: 1,
        question: "在关系型数据库中，以下哪个是最高的标准化范式？",
        options: [
          { id: "A", text: "第一范式(1NF)" },
          { id: "B", text: "第二范式(2NF)" },
          { id: "C", text: "第三范式(3NF)" },
          { id: "D", text: "BC范式(BCNF)" }
        ],
        correctAnswer: "D",
        explanation: "BC范式(BCNF, Boyce-Codd Normal Form)是比第三范式(3NF)更高级的范式，它要求所有决定因素必须是候选键。3NF只要求非主属性对候选键是完全函数依赖的，而BCNF则要求所有属性对候选键都是完全函数依赖的。"
      },
      {
        id: 2,
        question: "以下哪个SQL语句用于从数据库中选择数据？",
        options: [
          { id: "A", text: "INSERT" },
          { id: "B", text: "SELECT" },
          { id: "C", text: "UPDATE" },
          { id: "D", text: "DELETE" }
        ],
        correctAnswer: "B",
        explanation: "SELECT语句用于从数据库表中检索数据。INSERT用于插入新记录，UPDATE用于修改现有记录，DELETE用于删除记录。"
      }
    ]
  }
]; 