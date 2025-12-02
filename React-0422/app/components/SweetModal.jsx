'use client'
import React from 'react'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

export default function SweetModal({ show, onHide, title, message, icon }) {
  React.useEffect(() => {
    if (show) {
      Swal.fire({
        title: title,
        text: message,
        icon: icon,
        confirmButtonText: '關閉',
        confirmButtonColor: '#6c757d',
      }).then((result) => {
        if (result.isConfirmed) {
          onHide()
        }
      })
    }
  }, [show, title, message, onHide, icon])

  return null
}

// 使用範例
// import SweetModal from '@/app/components/SweetModal'

//  const [showModal, setShowModal] = useState(false)

{
  /* <SweetModal
  show={showModal}
  onHide={() => setShowModal(true)}
  title="提示"
  message="這是一個訊息"
  icon="info" // 可選 'success', 'error', 'warning', 'info', 'question'
/> */
}
