import math
import time
import cv2
import mediapipe as mp
import asyncio
import base64

# Define the center coordinates and radius of the drums
HIGH_TOM_CENTER = (120, 100)
SNARE_CENTER = (320, 240)
LOW_TOM_CENTER = (520, 100)
HIGH_CENTER = (120, 380)
FLOOR_TOM_CENTER = (520, 380)
DRUM_RADIUS = 60


def is_inside_circle(x, y, center, radius):
    """Check if the given coordinates are inside the circle"""
    return ((x - center[0]) ** 2 + (y - center[1]) ** 2) <= radius ** 2


def draw_drumstick(image, x1, y1, x2, y2):
    """Draw the drumstick on the image"""
    color = (0, 255, 0)
    thickness = 2
    cv2.line(image, (x1, y1), (x2, y2), color, thickness)
    cv2.circle(image, (x2, y2), 10, color, -1)


def draw_drums(image):
    """Draw the drums on the image"""
    color = (255, 255, 255)
    thickness = 2
    cv2.circle(image, HIGH_TOM_CENTER, DRUM_RADIUS, color, thickness)
    cv2.circle(image, SNARE_CENTER, DRUM_RADIUS, color, thickness)
    cv2.circle(image, LOW_TOM_CENTER, DRUM_RADIUS, color, thickness)
    cv2.circle(image, HIGH_CENTER, DRUM_RADIUS, color, thickness)


class HandDrums:
    def __init__(self):
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        self.mp_hands = mp.solutions.hands
        self.prev_index_finger_y = [None, None]  # Store previous y-coordinate of index finger for each hand
        self.hit_threshold = 20  # Threshold for detecting a drum hit
        self.is_inside_drum = [[False] * 5 for _ in range(2)]  # Track if finger is inside each drum for each hand
        self.last_hit_time = [[-1] * 5 for _ in range(2)]  # Store the last hit time for each drum and hand
        self.cooldown_time = 0.1  # Cooldown time between drum hits
        self.loop = asyncio.get_event_loop()

    async def process_frame(self, frame):
        """Process a single frame and detect drum hits"""
        with self.mp_hands.Hands(min_detection_confidence=0.6, min_tracking_confidence=0.5, max_num_hands=2) as hands:
            frame = cv2.flip(frame, 1)
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = await self.loop.run_in_executor(None, hands.process, frame_rgb)
            frame = cv2.cvtColor(frame_rgb, cv2.COLOR_RGB2BGR)
            draw_drums(frame)

            if results.multi_hand_landmarks:
                for hand_id, hand_landmarks in enumerate(results.multi_hand_landmarks):
                    landmark_list = []
                    for landmark_id, finger_axis in enumerate(hand_landmarks.landmark):
                        landmark_list.append([landmark_id, finger_axis.x, finger_axis.y, finger_axis.z])

                    if landmark_list:
                        index_finger_tip = landmark_list[8]
                        index_finger_dip = landmark_list[5]
                        index_finger_x = int(index_finger_tip[1] * frame.shape[1])
                        index_finger_y = int(index_finger_tip[2] * frame.shape[0])
                        index_finger_dip_x = int(index_finger_dip[1] * frame.shape[1])
                        index_finger_dip_y = int(index_finger_dip[2] * frame.shape[0])
                        draw_drumstick(frame, index_finger_dip_x, index_finger_dip_y, index_finger_x, index_finger_y)
                        try:
                            # Detect drum hits in a separate thread
                            drum_hit = await self.loop.run_in_executor(None, self.detect_index_finger_hit,
                                                                       index_finger_x, index_finger_y, hand_id)
                            if drum_hit:
                                return {'action': 'play_drum', 'drum_type': drum_hit}
                        except IndexError:
                            print(f"Warning: Detected more hands than expected ({len(self.prev_index_finger_y)})")

            frame = cv2.resize(frame, (960, 540))
            _, encoded_image = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
            return {'action': 'frame', 'frame': base64.b64encode(encoded_image).decode('utf-8')}

    def detect_index_finger_hit(self, x, y, hand_id):
        """Detect if the index finger hits a drum"""
        drum_hit = None
        if hand_id < len(self.prev_index_finger_y):
            if self.prev_index_finger_y[hand_id] is not None:
                if y - self.prev_index_finger_y[hand_id] > self.hit_threshold:
                    if is_inside_circle(x, y, HIGH_TOM_CENTER, DRUM_RADIUS) and not self.is_inside_drum[hand_id][0]:
                        if time.time() - self.last_hit_time[hand_id][0] > self.cooldown_time:
                            self.is_inside_drum[hand_id][0] = True
                            self.last_hit_time[hand_id][0] = time.time()
                            drum_hit = 'high_tom'
                    elif is_inside_circle(x, y, SNARE_CENTER, DRUM_RADIUS) and not self.is_inside_drum[hand_id][1]:
                        if time.time() - self.last_hit_time[hand_id][1] > self.cooldown_time:
                            self.is_inside_drum[hand_id][1] = True
                            self.last_hit_time[hand_id][1] = time.time()
                            drum_hit = 'snare'
                    elif is_inside_circle(x, y, LOW_TOM_CENTER, DRUM_RADIUS) and not self.is_inside_drum[hand_id][2]:
                        if time.time() - self.last_hit_time[hand_id][2] > self.cooldown_time:
                            self.is_inside_drum[hand_id][2] = True
                            self.last_hit_time[hand_id][2] = time.time()
                            drum_hit = 'low_tom'
                    elif is_inside_circle(x, y, HIGH_CENTER, DRUM_RADIUS) and not self.is_inside_drum[hand_id][3]:
                        if time.time() - self.last_hit_time[hand_id][3] > self.cooldown_time:
                            self.is_inside_drum[hand_id][3] = True
                            self.last_hit_time[hand_id][3] = time.time()
                            drum_hit = 'high'
                    else:
                        drum_hit = None
                else:
                    self.is_inside_drum[hand_id] = [False] * 5
                    drum_hit = None
            else:
                drum_hit = None

            self.prev_index_finger_y[hand_id] = y
        else:
            drum_hit = None

        return drum_hit
