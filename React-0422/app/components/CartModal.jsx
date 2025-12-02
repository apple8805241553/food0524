import { Modal, Button } from 'react-bootstrap'

export default function CartModal({ show, onHide, title, message }) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          關閉
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
// 使用前記得在要使用的Page中引入
// import CartModal from '@/app/components/CartModal'

// 接著寫上這個狀態(用途為控制彈出視窗是否要顯示)
//   const [showCartModal, setShowCartModal] = useState(false)

// 然後寫上這個狀態(用途為控制彈出視窗的內容) 這行不寫也可以，
// 就自己手動在page頁面內的CartModal組件的message那邊寫上message="你要顯示的文字內容"
//   const [cartModalMessage, setCartModalMessage] = useState('')

// 在要使用通用彈出視窗的Page的return中加入以下程式碼
//  <CartModal
//             show={showCartModal}
//             onHide={() => setShowCartModal(false)}
//             title="購物車訊息"
//             message={cartModalMessage}
//           />

// 接著在你想要觸發這個通用彈出視窗的地方寫上
//  setCartModalMessage('這裡面是填入你要顯示的文字內容')
//   setShowCartModal(true)

// 通常是會顯示在if判斷式裡面
// 例如
//  if (cart.length === 0) {
//     setCartModalMessage('購物車是空的')
//     setShowCartModal(true)
//   }
