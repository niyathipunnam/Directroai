import cv2
import numpy as np
import mediapipe as mp


def get_face_landmarks(image):
    try:
        import mediapipe.python.solutions.face_mesh as mp_face_mesh
    except Exception:
        try:
            mp_face_mesh = mp.solutions.face_mesh
        except Exception:
            return None
        
    try:
        with mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True, min_detection_confidence=0.5) as face_mesh:
            results = face_mesh.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
            if not results.multi_face_landmarks:
                return None
            landmarks = []
            for landmark in results.multi_face_landmarks[0].landmark:
                x = int(landmark.x * image.shape[1])
                y = int(landmark.y * image.shape[0])
                landmarks.append((x, y))
            return np.array(landmarks)
    except Exception as e:
        return None

def face_swap(target_image_path, source_image_path, output_path):
    try:
        # Read images
        img1 = cv2.imread(source_image_path) # The uploaded face
        img2 = cv2.imread(target_image_path) # The generated storyboard
        
        if img1 is None or img2 is None:
            return False
            
        # Get landmarks
        landmarks1 = get_face_landmarks(img1)
        landmarks2 = get_face_landmarks(img2)
        
        if landmarks1 is None or landmarks2 is None:
            return False
            
        # Create convex hull for target face
        hull2 = cv2.convexHull(landmarks2)
        
        # Calculate affine transform from source face to target face
        # 33 is left eye left corner, 263 is right eye right corner, 15 is chin/mouth
        src_pts = np.float32([landmarks1[33], landmarks1[263], landmarks1[15]])
        dst_pts = np.float32([landmarks2[33], landmarks2[263], landmarks2[15]])
        
        M = cv2.getAffineTransform(src_pts, dst_pts)
        
        # Warp source image to fit target
        warped_img1 = cv2.warpAffine(img1, M, (img2.shape[1], img2.shape[0]))
        
        # Create mask for seamless clone
        mask = np.zeros_like(img2[:, :, 0])
        cv2.fillConvexPoly(mask, hull2, 255)
        
        # Seamless clone center
        r2 = cv2.boundingRect(hull2)
        center = (r2[0] + r2[2]//2, r2[1] + r2[3]//2)
            
        # Seamless clone
        output = cv2.seamlessClone(warped_img1, img2, mask, center, cv2.NORMAL_CLONE)
        cv2.imwrite(output_path, output)
        return True
    except Exception as e:
        print("Face swap failed:", e)
        return False


